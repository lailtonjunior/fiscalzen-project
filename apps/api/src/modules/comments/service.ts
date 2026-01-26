import { injectable, inject, container } from 'tsyringe';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@fiscalzen/database/schema';
import { comments, documents } from '@fiscalzen/database/schema';
import { DATABASE_TOKEN } from '../../providers/database';
import { NotFoundError } from '../../utils/errors';

type Database = NodePgDatabase<typeof schema>;

export interface CreateCommentDto {
    documentId: string;
    content: string;
    isInternal?: boolean;
    parentId?: string;
}

@injectable()
export class CommentsService {
    constructor(
        @inject(DATABASE_TOKEN) private db: Database
    ) { }

    async create(tenantId: string, userId: string, data: CreateCommentDto) {
        // Check document
        const doc = await this.db.query.documents.findFirst({
            where: and(eq(documents.id, data.documentId), eq(documents.tenantId, tenantId))
        });
        if (!doc) throw new NotFoundError('Documento');

        const [comment] = await this.db.insert(comments).values({
            tenantId,
            documentId: data.documentId,
            userId,
            content: data.content,
            isInternal: data.isInternal || false,
            parentId: data.parentId
        }).returning();

        // Mentions logic could go here (e.g. queue a job)

        return comment;
    }

    async list(documentId: string, tenantId: string) {
        // Check ownership by tenantId
        const list = await this.db
            .select()
            .from(comments)
            .where(and(
                eq(comments.documentId, documentId),
                eq(comments.tenantId, tenantId),
                isNull(comments.deletedAt)
            ))
            .orderBy(asc(comments.createdAt));

        // In a real app we would join with a Users table/service to get user names.
        // Since we don't have a Users table locally, we just return the userId.
        // The frontend/gateway might enrich this data.

        return list;
    }

    async update(commentId: string, tenantId: string, userId: string, content: string) {
        const [comment] = await this.db
            .update(comments)
            .set({ content, updatedAt: new Date() })
            .where(and(
                eq(comments.id, commentId),
                eq(comments.tenantId, tenantId),
                eq(comments.userId, userId) // Only author can edit
            ))
            .returning();

        if (!comment) {
            throw new NotFoundError('Comentário não encontrado ou sem permissão');
        }

        return comment;
    }

    async delete(commentId: string, tenantId: string, userId: string) {
        const [comment] = await this.db
            .update(comments)
            .set({ deletedAt: new Date() })
            .where(and(
                eq(comments.id, commentId),
                eq(comments.tenantId, tenantId),
                eq(comments.userId, userId)
            ))
            .returning();

        if (!comment) throw new NotFoundError('Comentário não encontrado ou sem permissão');
    }
}

export const commentsService = container.resolve(CommentsService);
