import type { FastifyInstance } from 'fastify';
import { documentsService } from './service.js';
import {
  listDocumentsQuerySchema,
  documentIdSchema,
  searchDocumentsQuerySchema,
  uploadXmlSchema,
  documentByChaveSchema,
  type ListDocumentsQuery,
  type DocumentIdParams,
  type SearchDocumentsQuery,
  type DocumentByChaveParams,
} from './schemas.js';
import { getTenantId } from '../../plugins/auth.js';
import { sendSuccess, paginate } from '../../utils/response.js';
import { ValidationError } from '../../utils/errors.js';

export async function documentsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/documents - List documents with filters
  fastify.get<{
    Querystring: ListDocumentsQuery;
  }>('/', async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = listDocumentsQuerySchema.parse(request.query);

    const { items, total } = await documentsService.list(tenantId, query);
    const { data, pagination } = paginate(items, total, query.page, query.limit);

    return sendSuccess(reply, data, 200, pagination);
  });

  // GET /api/v1/documents/search - Full-text search
  fastify.get<{
    Querystring: SearchDocumentsQuery;
  }>('/search', async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = searchDocumentsQuerySchema.parse(request.query);

    const result = await documentsService.search(tenantId, query);

    return sendSuccess(reply, result.hits, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: Math.ceil(result.total / result.limit),
    });
  });

  // POST /api/v1/documents/upload - Upload XML manually
  fastify.post('/upload', async (request, reply) => {
    const tenantId = getTenantId(request);

    const data = await request.file();

    if (!data) {
      throw new ValidationError('Arquivo XML nao enviado');
    }

    const fields = data.fields as Record<string, { value?: string }>;
    const companyId = fields.companyId?.value;

    if (!companyId) {
      throw new ValidationError('Company ID e obrigatorio');
    }

    uploadXmlSchema.parse({ companyId });

    const xmlContent = await data.toBuffer();
    const document = await documentsService.uploadXml(tenantId, companyId, xmlContent.toString('utf-8'));

    return sendSuccess(reply, document, 201);
  });

  // GET /api/v1/documents/chave/:chave - Get by chave de acesso
  fastify.get<{
    Params: DocumentByChaveParams;
  }>('/chave/:chave', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { chave } = documentByChaveSchema.parse(request.params);

    const document = await documentsService.getByChave(tenantId, chave);

    return sendSuccess(reply, document);
  });

  // GET /api/v1/documents/:id - Get document details
  fastify.get<{
    Params: DocumentIdParams;
  }>('/:id', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = documentIdSchema.parse(request.params);

    const document = await documentsService.getById(tenantId, id);

    return sendSuccess(reply, document);
  });

  // GET /api/v1/documents/:id/xml - Download original XML
  fastify.get<{
    Params: DocumentIdParams;
  }>('/:id/xml', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = documentIdSchema.parse(request.params);

    const xml = await documentsService.getXml(tenantId, id);

    return reply
      .header('Content-Type', 'application/xml')
      .header('Content-Disposition', `attachment; filename="${id}.xml"`)
      .send(xml);
  });

  // GET /api/v1/documents/:id/pdf - Get PDF download URL
  fastify.get<{
    Params: DocumentIdParams;
  }>('/:id/pdf', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = documentIdSchema.parse(request.params);

    const url = await documentsService.getPdfUrl(tenantId, id);

    return sendSuccess(reply, { url });
  });
}
