import { MeiliSearch } from 'meilisearch';
import { env } from './env';
import { logger } from './logger';

export const meilisearch = new MeiliSearch({
  host: env.MEILISEARCH_URL,
  apiKey: env.MEILISEARCH_API_KEY,
});

export const INDEXES = {
  DOCUMENTS: 'documents',
} as const;

export async function checkMeilisearchConnection(): Promise<boolean> {
  try {
    await meilisearch.health();
    return true;
  } catch (error) {
    logger.warn(
      { err: error, host: env.MEILISEARCH_URL },
      'Meilisearch health check failed; search will be limited'
    );
    return false;
  }
}

export async function setupMeilisearchIndexes(): Promise<boolean> {
  try {
    // Create documents index if not exists
    const indexes = await meilisearch.getIndexes();
    const documentsIndex = indexes.results.find((i) => i.uid === INDEXES.DOCUMENTS);

    if (!documentsIndex) {
      await meilisearch.createIndex(INDEXES.DOCUMENTS, { primaryKey: 'id' });
    }

    // Configure searchable attributes
    const index = meilisearch.index(INDEXES.DOCUMENTS);

    await index.updateSettings({
      searchableAttributes: [
        'chave',
        'numero',
        'emitRazaoSocial',
        'emitCnpj',
        'destRazaoSocial',
        'destCnpj',
        'natOp',
        'infAdic',
      ],
      filterableAttributes: [
        'companyId',
        'tenantId',
        'docType',
        'situacao',
        'dataEmissao',
        'emitCnpj',
        'destCnpj',
        'uf',
      ],
      sortableAttributes: [
        'dataEmissao',
        'valorTotal',
        'numero',
        'createdAt',
      ],
      displayedAttributes: [
        'id',
        'chave',
        'numero',
        'serie',
        'docType',
        'situacao',
        'dataEmissao',
        'valorTotal',
        'emitRazaoSocial',
        'emitCnpj',
        'destRazaoSocial',
        'destCnpj',
        'natOp',
      ],
    });

    logger.info(
      { host: env.MEILISEARCH_URL, index: INDEXES.DOCUMENTS },
      'Meilisearch indexes configured'
    );
    return true;
  } catch (error) {
    logger.warn(
      {
        err: error,
        host: env.MEILISEARCH_URL,
        index: INDEXES.DOCUMENTS,
        hasApiKey: Boolean(env.MEILISEARCH_API_KEY),
      },
      'Meilisearch index setup failed; API startup will continue with search degraded'
    );
    return false;
  }
}
