import { injectable, inject, container } from 'tsyringe';
import { eq, and, inArray, desc, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@fiscalzen/database/schema';
import { tags, documentTags, documents } from '@fiscalzen/database/schema';
import { DATABASE_TOKEN } from '../../providers/database';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { search } from '../../services/search';

type Database = NodePgDatabase<typeof schema>;

export interface CreateTagDto {
    name: string;
    color?: string;
    description?: string;
    icon?: string;
}

export interface PaginationParams {
    page: number;
    limit: number;
}

import { WebhookService } from '../webhooks/service';

@injectable()
export class TagsService {
    constructor(
        @inject(DATABASE_TOKEN) private db: Database,
        private webhookService: WebhookService
    ) { }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD') // Split accents
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^\w\s-]/g, '') // Remove non-word chars
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/-+/g, '-') // Remove duplicates
            .trim();
    }

    async create(tenantId: string, userId: string, data: CreateTagDto) {
        const slug = this.generateSlug(data.name);

        const [tag] = await this.db.insert(tags).values({
            tenantId,
            name: data.name,
            slug,
            color: data.color || '#6366f1',
            description: data.description,
            icon: data.icon,
            createdBy: userId,
            isSystem: false,
        }).returning();

        return tag;
    }

    async list(tenantId: string) {
        return this.db
            .select()
            .from(tags)
            .where(eq(tags.tenantId, tenantId))
            .orderBy(tags.name);
    }

    async update(tagId: string, tenantId: string, data: Partial<CreateTagDto>) {
        const slug = data.name ? this.generateSlug(data.name) : undefined;

        const [tag] = await this.db
            .update(tags)
            .set({
                ...data,
                slug,
            })
            .where(and(eq(tags.id, tagId), eq(tags.tenantId, tenantId)))
            .returning();

        if (!tag) {
            throw new NotFoundError('Tag não encontrada');
        }

        return tag;
    }

    async delete(tagId: string, tenantId: string) {
        const [tag] = await this.db
            .delete(tags)
            .where(and(
                eq(tags.id, tagId),
                eq(tags.tenantId, tenantId),
                eq(tags.isSystem, false) // Prevent deleting system tags check via DB constraint or here
            ))
            .returning();

        if (!tag) {
            // Check if it was system tag or not found
            const exists = await this.db.query.tags.findFirst({
                where: and(eq(tags.id, tagId), eq(tags.tenantId, tenantId))
            });
            if (exists && exists.isSystem) {
                throw new ValidationError('Tags de sistema não podem ser excluídas');
            }
            throw new NotFoundError('Tag não encontrada');
        }
    }

    async addTagsToDocument(
        documentId: string,
        tagIds: string[],
        tenantId: string,
        userId: string
    ): Promise<void> {
        if (tagIds.length === 0) return;

        // Check document exists/belongs to tenant
        const doc = await this.db.query.documents.findFirst({
            where: and(eq(documents.id, documentId), eq(documents.tenantId, tenantId))
        });
        if (!doc) throw new NotFoundError('Documento');

        // Check tags exist
        const existingTags = await this.db
            .select({ id: tags.id, name: tags.name })
            .from(tags)
            .where(and(
                eq(tags.tenantId, tenantId),
                inArray(tags.id, tagIds)
            ));

        if (existingTags.length !== tagIds.length) {
            // Some simple check, or just ignore missing?
            // Strict:
            // throw new ValidationError('Uma ou mais tags não encontradas');
        }

        // Insert
        await this.db.insert(documentTags).values(
            tagIds.map(tagId => ({
                documentId,
                tagId,
                createdBy: userId
            }))
        ).onConflictDoNothing();

        // Update Search Index
        const allDocTags = await this.db
            .select({ name: tags.name })
            .from(documentTags)
            .innerJoin(tags, eq(documentTags.tagId, tags.id))
            .where(eq(documentTags.documentId, documentId));

        await search.updateDocumentTags(documentId, allDocTags.map(t => t.name));

        // Emit webhook event (Correctly placed here)
        await this.webhookService.dispatch(tenantId, 'document.tagged', {
            documentId,
            tags: tagIds
        });
    }

    async removeTagFromDocument(documentId: string, tagId: string, tenantId: string): Promise<void> {
        // Verify ownership implicitly via delete where clause if possible, but document_tags doesn't have tenantId.
        // So we must verify document tenant first.
        const doc = await this.db.query.documents.findFirst({
            where: and(eq(documents.id, documentId), eq(documents.tenantId, tenantId))
        });
        if (!doc) throw new NotFoundError('Documento');

        await this.db
            .delete(documentTags)
            .where(and(
                eq(documentTags.documentId, documentId),
                eq(documentTags.tagId, tagId)
            ));

        // Update Search Index
        const allDocTags = await this.db
            .select({ name: tags.name })
            .from(documentTags)
            .innerJoin(tags, eq(documentTags.tagId, tags.id))
            .where(eq(documentTags.documentId, documentId));

        await search.updateDocumentTags(documentId, allDocTags.map(t => t.name));
    }

    async findDocumentsByTag(tenantId: string, tagSlug: string, pagination: PaginationParams) {
        const tag = await this.db
            .select()
            .from(tags)
            .where(and(
                eq(tags.tenantId, tenantId),
                eq(tags.slug, tagSlug)
            ))
            .limit(1);

        if (!tag[0]) {
            throw new NotFoundError('Tag não encontrada');
        }

        const offset = (pagination.page - 1) * pagination.limit;

        const [docs, countResult] = await Promise.all([
            this.db
                .select({
                    id: documents.id,
                    chave: documents.chave,
                    numero: documents.numero,
                    req: documents.createdAt
                    // Select relevant fields
                })
                .from(documentTags)
                .innerJoin(documents, eq(documentTags.documentId, documents.id))
                .where(eq(documentTags.tagId, tag[0].id))
                .orderBy(desc(documents.dataEmissao))
                .limit(pagination.limit)
                .offset(offset),

            this.db
                .select({ count: sql<number>`count(*)` })
                .from(documentTags)
                .where(eq(documentTags.tagId, tag[0].id))
        ]);

        return {
            items: docs, // Mapping usually done in controller or returning raw partials
            total: Number(countResult[0]?.count ?? 0),
            page: pagination.page,
            limit: pagination.limit,
            tag: tag[0]
        };
    }
}
export const tagsService = container.resolve(TagsService);
