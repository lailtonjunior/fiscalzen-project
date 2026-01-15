import { meilisearch, INDEXES } from '../config/meilisearch';
import { ExternalServiceError } from '../utils/errors';

export interface DocumentSearchRecord {
  id: string;
  tenantId: string;
  companyId: string;
  chave: string;
  numero: string;
  serie: string;
  docType: string;
  situacao: string;
  dataEmissao: string;
  valorTotal: number;
  emitRazaoSocial: string;
  emitCnpj: string;
  destRazaoSocial?: string;
  destCnpj?: string;
  natOp?: string;
  infAdic?: string;
  uf: string;
  createdAt: string;
}

export interface SearchFilters {
  companyId?: string;
  tenantId?: string;
  docType?: string;
  situacao?: string;
  dataInicio?: string;
  dataFim?: string;
  emitCnpj?: string;
  destCnpj?: string;
  uf?: string;
}

export interface SearchResult {
  hits: DocumentSearchRecord[];
  total: number;
  processingTimeMs: number;
  page: number;
  limit: number;
}

function buildFilters(filters: SearchFilters): string[] {
  const filterArray: string[] = [];

  if (filters.tenantId) {
    filterArray.push(`tenantId = "${filters.tenantId}"`);
  }

  if (filters.companyId) {
    filterArray.push(`companyId = "${filters.companyId}"`);
  }

  if (filters.docType) {
    filterArray.push(`docType = "${filters.docType}"`);
  }

  if (filters.situacao) {
    filterArray.push(`situacao = "${filters.situacao}"`);
  }

  if (filters.emitCnpj) {
    filterArray.push(`emitCnpj = "${filters.emitCnpj}"`);
  }

  if (filters.destCnpj) {
    filterArray.push(`destCnpj = "${filters.destCnpj}"`);
  }

  if (filters.uf) {
    filterArray.push(`uf = "${filters.uf}"`);
  }

  if (filters.dataInicio && filters.dataFim) {
    filterArray.push(`dataEmissao >= "${filters.dataInicio}" AND dataEmissao <= "${filters.dataFim}"`);
  } else if (filters.dataInicio) {
    filterArray.push(`dataEmissao >= "${filters.dataInicio}"`);
  } else if (filters.dataFim) {
    filterArray.push(`dataEmissao <= "${filters.dataFim}"`);
  }

  return filterArray;
}

export const search = {
  async indexDocument(doc: DocumentSearchRecord): Promise<void> {
    try {
      const index = meilisearch.index(INDEXES.DOCUMENTS);
      await index.addDocuments([doc]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceError('Meilisearch', `Falha ao indexar documento: ${message}`);
    }
  },

  async indexDocuments(docs: DocumentSearchRecord[]): Promise<void> {
    if (docs.length === 0) return;

    try {
      const index = meilisearch.index(INDEXES.DOCUMENTS);
      await index.addDocuments(docs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceError('Meilisearch', `Falha ao indexar documentos: ${message}`);
    }
  },

  async searchDocuments(
    query: string,
    filters: SearchFilters,
    page: number = 1,
    limit: number = 50,
    sort?: string[]
  ): Promise<SearchResult> {
    try {
      const index = meilisearch.index(INDEXES.DOCUMENTS);
      const filterArray = buildFilters(filters);

      const result = await index.search(query, {
        filter: filterArray.length > 0 ? filterArray : undefined,
        limit,
        offset: (page - 1) * limit,
        sort: sort ?? ['dataEmissao:desc'],
      });

      return {
        hits: result.hits as DocumentSearchRecord[],
        total: result.estimatedTotalHits ?? result.hits.length,
        processingTimeMs: result.processingTimeMs,
        page,
        limit,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceError('Meilisearch', `Falha na busca: ${message}`);
    }
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      const index = meilisearch.index(INDEXES.DOCUMENTS);
      await index.deleteDocument(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceError('Meilisearch', `Falha ao deletar documento: ${message}`);
    }
  },

  async deleteDocumentsByTenant(tenantId: string): Promise<void> {
    try {
      const index = meilisearch.index(INDEXES.DOCUMENTS);
      await index.deleteDocuments({
        filter: `tenantId = "${tenantId}"`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceError('Meilisearch', `Falha ao deletar documentos: ${message}`);
    }
  },

  async getDocument(id: string): Promise<DocumentSearchRecord | null> {
    try {
      const index = meilisearch.index(INDEXES.DOCUMENTS);
      return await index.getDocument(id) as DocumentSearchRecord;
    } catch (error) {
      // Document not found
      return null;
    }
  },
};
