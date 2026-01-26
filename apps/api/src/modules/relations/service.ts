import { injectable, inject } from 'tsyringe';
import { eq, and, isNull, notInArray, gte, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@fiscalzen/database/schema';
import { documentRelations, documents } from '@fiscalzen/database/schema';
import { DATABASE_TOKEN } from '../../providers/database';

type Database = NodePgDatabase<typeof schema>;

export interface NewDocumentRelation {
    tenantId: string;
    sourceDocumentId?: string;
    sourceChave: string;
    sourceType: string;
    targetDocumentId?: string;
    targetChave: string;
    targetType: string;
    relationType: string;
    metadata?: any;
}

@injectable()
export class RelationsService {
    constructor(
        @inject(DATABASE_TOKEN) private db: Database
    ) { }

    /**
     * Extrair e criar relacionamentos ao processar documento
     */
    async processDocumentRelations(document: any, parsedXml: any): Promise<void> {
        const relationsList: NewDocumentRelation[] = [];

        switch (document.docType) {
            case 'CTE':
                const nfesReferenciadas = this.extractNFeFromCTe(parsedXml);
                for (const nfeChave of nfesReferenciadas) {
                    relationsList.push({
                        tenantId: document.tenantId,
                        sourceDocumentId: document.id,
                        sourceChave: document.chave,
                        sourceType: 'CTE',
                        targetChave: nfeChave,
                        targetType: 'NFE',
                        relationType: 'cte_transporta_nfe'
                    });
                }
                break;

            case 'MDFE':
                // MDFe logic placeholder (parsedXml structure for MDFe needed)
                // const documentosVinculados = this.extractDocumentsFromMDFe(parsedXml);
                break;

            case 'NFE':
                // NFe logic placeholder
                break;
        }

        // Inserir relacionamentos
        if (relationsList.length > 0) {
            await this.db.insert(documentRelations)
                .values(relationsList as any)
                .onConflictDoNothing();

            // Tentar vincular com documentos existentes
            await this.linkExistingDocuments(document.tenantId, relationsList);
        }
    }

    /**
     * Vincular com documentos que ja existem no banco
     */
    private async linkExistingDocuments(tenantId: string, relationsInfo: NewDocumentRelation[]): Promise<void> {
        for (const relation of relationsInfo) {
            // Buscar documento target se existir
            const targetDoc = await this.db.query.documents.findFirst({
                where: and(eq(documents.chave, relation.targetChave), eq(documents.tenantId, tenantId))
            });

            if (targetDoc) {
                await this.db
                    .update(documentRelations)
                    .set({ targetDocumentId: targetDoc.id })
                    .where(and(
                        eq(documentRelations.tenantId, tenantId),
                        eq(documentRelations.targetChave, relation.targetChave),
                        isNull(documentRelations.targetDocumentId)
                    ));
            }
        }
    }

    /**
     * Consultar documentos relacionados
     */
    async getRelatedDocuments(
        documentId: string,
        tenantId: string,
        direction: 'source' | 'target' | 'both' = 'both'
    ) {
        const results = {
            transportadoPor: [] as any[],  // CTe/MDFe que transportam este documento
            transporta: [] as any[],       // Documentos que este transporta
            referencias: [] as any[],      // Documentos referenciados
            referenciadoPor: [] as any[]   // Documentos que referenciam este
        };

        // Buscar onde este documento e SOURCE (ex: CTe que transporta NFe)
        if (direction === 'source' || direction === 'both') {
            const asSource = await this.db
                .select({
                    relation: documentRelations,
                    targetDocument: documents
                })
                .from(documentRelations)
                .leftJoin(documents, eq(documentRelations.targetDocumentId, documents.id))
                .where(and(
                    eq(documentRelations.tenantId, tenantId),
                    eq(documentRelations.sourceDocumentId, documentId)
                ));

            for (const row of asSource) {
                const related = {
                    chave: row.relation.targetChave,
                    tipo: row.relation.targetType,
                    relationType: row.relation.relationType,
                    document: row.targetDocument,
                    existeNoBanco: !!row.targetDocument
                };

                if (row.relation.relationType.includes('transporta') || row.relation.relationType.includes('contem')) {
                    results.transporta.push(related);
                } else {
                    results.referencias.push(related);
                }
            }
        }

        // Buscar onde este documento e TARGET (ex: NFe transportada por CTe)
        if (direction === 'target' || direction === 'both') {
            const asTarget = await this.db
                .select({
                    relation: documentRelations,
                    sourceDocument: documents
                })
                .from(documentRelations)
                .leftJoin(documents, eq(documentRelations.sourceDocumentId, documents.id))
                .where(and(
                    eq(documentRelations.tenantId, tenantId),
                    eq(documentRelations.targetDocumentId, documentId)
                ));

            for (const row of asTarget) {
                const related = {
                    chave: row.relation.sourceChave,
                    tipo: row.relation.sourceType,
                    relationType: row.relation.relationType,
                    document: row.sourceDocument,
                    existeNoBanco: !!row.sourceDocument
                };

                if (row.relation.relationType.includes('transporta') || row.relation.relationType.includes('contem')) {
                    results.transportadoPor.push(related);
                } else {
                    results.referenciadoPor.push(related);
                }
            }
        }

        return results;
    }

    /**
     * Buscar NFe orfas (sem CTe vinculado)
     */
    async findOrphanNFes(tenantId: string, filters?: { startDate?: Date; endDate?: Date }) {
        const subquery = this.db
            .select({ targetChave: documentRelations.targetChave })
            .from(documentRelations)
            .where(and(
                eq(documentRelations.tenantId, tenantId),
                eq(documentRelations.relationType, 'cte_transporta_nfe')
            ));

        const conditions = [
            eq(documents.tenantId, tenantId),
            eq(documents.docType, 'NFE'), // Check case in DB
            notInArray(documents.chave, subquery)
        ];

        if (filters?.startDate) conditions.push(gte(documents.dataEmissao, filters.startDate.toISOString().split('T')[0]));
        if (filters?.endDate) conditions.push(lte(documents.dataEmissao, filters.endDate.toISOString().split('T')[0]));

        return this.db
            .select()
            .from(documents)
            .where(and(...conditions));
    }

    // Specific getters for simple API calls
    async getCTesForNFe(nfeChave: string, tenantId: string) {
        // Find where NFe is target of a CTe relation
        return this.db.select({
            cte: documents
        })
            .from(documentRelations)
            .innerJoin(documents, eq(documentRelations.sourceDocumentId, documents.id))
            .where(and(
                eq(documentRelations.tenantId, tenantId),
                eq(documentRelations.targetChave, nfeChave),
                eq(documentRelations.relationType, 'cte_transporta_nfe')
            ));
    }

    async getNFesFromCTe(cteChave: string, tenantId: string) {
        // Find where CTe is source
        return this.db.select({
            nfe: documents,
            relation: documentRelations
        })
            .from(documentRelations)
            .leftJoin(documents, eq(documentRelations.targetDocumentId, documents.id))
            .where(and(
                eq(documentRelations.tenantId, tenantId),
                eq(documentRelations.sourceChave, cteChave),
                eq(documentRelations.relationType, 'cte_transporta_nfe')
            ));
    }

    /**
     * Extract NFe chaves from parsed CTe data
     */
    private extractNFeFromCTe(parsedCTe: any): string[] {
        if (!parsedCTe.documentosOriginarios || !Array.isArray(parsedCTe.documentosOriginarios)) {
            return [];
        }

        return parsedCTe.documentosOriginarios
            .filter((doc: any) => doc.tipo === 'NFE' && doc.chave)
            .map((doc: any) => String(doc.chave));
    }

    /**
     * Extract CTe chaves from parsed MDFe data
     */
    private extractCTesFromMDFe(parsedMDFe: any): string[] {
        if (!parsedMDFe.documentosVinculados || !Array.isArray(parsedMDFe.documentosVinculados)) {
            return [];
        }

        return parsedMDFe.documentosVinculados
            .filter((doc: any) => doc.tipo === 'CTE' && doc.chave)
            .map((doc: any) => String(doc.chave));
    }

    /**
     * Extract NFe chaves from parsed MDFe data (direct NFe transport)
     */
    private extractNFesFromMDFe(parsedMDFe: any): string[] {
        if (!parsedMDFe.documentosVinculados || !Array.isArray(parsedMDFe.documentosVinculados)) {
            return [];
        }

        return parsedMDFe.documentosVinculados
            .filter((doc: any) => doc.tipo === 'NFE' && doc.chave)
            .map((doc: any) => String(doc.chave));
    }
}
