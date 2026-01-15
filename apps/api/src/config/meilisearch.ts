import { MeiliSearch } from 'meilisearch';
import { env } from './env';

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
    console.error('Meilisearch connection failed:', error);
    return false;
  }
}

export async function setupMeilisearchIndexes(): Promise<void> {
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

    console.log('Meilisearch indexes configured');
  } catch (error) {
    console.error('Failed to setup Meilisearch indexes:', error);
  }
}
