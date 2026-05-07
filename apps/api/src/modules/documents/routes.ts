import type { FastifyInstance } from 'fastify';
import { documentsService } from './service';
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
} from './schemas';
import { getTenantId, getUserId } from '../../plugins/auth';
import { sendSuccess, paginate } from '../../utils/response';
import { ValidationError } from '../../utils/errors';
import { zodToFastify, standardResponses } from '../../utils/schema-converter';
import { serializePublicDocument } from './public-document';

export async function documentsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/documents - List documents with filters
  fastify.get<{
    Querystring: ListDocumentsQuery;
  }>('/', {
    schema: {
      tags: ['Documents'],
      summary: 'Listar documentos fiscais',
      description: 'Retorna lista paginada de documentos fiscais (NF-e, CT-e, MDF-e) com filtros',
      querystring: zodToFastify(listDocumentsQuerySchema),
      response: {
        200: {
          description: 'Lista de documentos',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object', additionalProperties: true } },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                pageSize: { type: 'integer' },
                total: { type: 'integer' },
                hasNext: { type: 'boolean' },
                totalPages: { type: 'integer' },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
          required: ['success', 'data', 'meta'],
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = listDocumentsQuerySchema.parse(request.query);

    const { items, total } = await documentsService.list(tenantId, query);
    const { data, pagination } = paginate(items, total, query.page, query.limit);

    return sendSuccess(reply, data, 200, pagination);
  });

  // GET /api/v1/documents/search - Full-text search
  fastify.get<{
    Querystring: SearchDocumentsQuery;
  }>('/search', {
    schema: {
      tags: ['Documents'],
      summary: 'Buscar documentos',
      description: 'Busca full-text em documentos fiscais usando Meilisearch',
      querystring: zodToFastify(searchDocumentsQuerySchema),
      response: {
        200: {
          description: 'Resultados da busca',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object', additionalProperties: true } },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                pageSize: { type: 'integer' },
                total: { type: 'integer' },
                hasNext: { type: 'boolean' },
                totalPages: { type: 'integer' },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
          required: ['success', 'data', 'meta'],
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = searchDocumentsQuerySchema.parse(request.query);

    const result = await documentsService.search(tenantId, query);

    return sendSuccess(reply, result.hits, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: Math.ceil(result.total / result.limit),
      totalPages: Math.ceil(result.total / result.limit),
    });
  });

  // POST /api/v1/documents/upload - Upload XML manually
  fastify.post('/upload', {
    schema: {
      tags: ['Documents'],
      summary: 'Upload de XML',
      description: 'Faz upload manual de um arquivo XML de documento fiscal',
      consumes: ['multipart/form-data'],
      response: {
        201: {
          description: 'Documento processado com sucesso',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', additionalProperties: true },
          },
        },
        400: standardResponses[400],
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
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

    return sendSuccess(reply, serializePublicDocument(document as Record<string, unknown>), 201);
  });

  // GET /api/v1/documents/chave/:chave - Get by chave de acesso
  fastify.get<{
    Params: DocumentByChaveParams;
  }>('/chave/:chave', {
    schema: {
      tags: ['Documents'],
      summary: 'Buscar por chave de acesso',
      description: 'Retorna documento pela chave de acesso (44 dígitos)',
      params: zodToFastify(documentByChaveSchema),
      response: {
        200: {
          description: 'Documento encontrado',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', additionalProperties: true },
          },
        },
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { chave } = documentByChaveSchema.parse(request.params);

    const document = await documentsService.getByChave(tenantId, chave);

    return sendSuccess(reply, serializePublicDocument(document as Record<string, unknown>));
  });

  // GET /api/v1/documents/:id - Get document details
  fastify.get<{
    Params: DocumentIdParams;
  }>('/:id', {
    schema: {
      tags: ['Documents'],
      summary: 'Obter documento',
      description: 'Retorna detalhes completos de um documento fiscal',
      params: zodToFastify(documentIdSchema),
      response: {
        200: {
          description: 'Detalhes do documento',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', additionalProperties: true },
          },
        },
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = documentIdSchema.parse(request.params);

    const document = await documentsService.getById(tenantId, id);

    return sendSuccess(reply, serializePublicDocument(document as Record<string, unknown>));
  });

  // GET /api/v1/documents/:id/attachments - List available fiscal attachments
  fastify.get<{
    Params: DocumentIdParams;
  }>('/:id/attachments', {
    schema: {
      tags: ['Documents'],
      summary: 'Listar anexos fiscais',
      description: 'Retorna os anexos disponiveis para o documento, sem expor chaves internas de storage',
      params: zodToFastify(documentIdSchema),
      response: {
        200: {
          description: 'Lista de anexos disponiveis',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['xml', 'pdf'] },
                  label: { type: 'string' },
                  available: { type: 'boolean' },
                  filename: { type: 'string' },
                  downloadPath: { type: 'string' },
                  representation: { type: 'string' },
                  statusMessage: { type: 'string' },
                },
                required: ['type', 'label', 'available', 'filename', 'downloadPath'],
              },
            },
          },
        },
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = documentIdSchema.parse(request.params);
    const attachments = await documentsService.listAttachments(tenantId, id);

    return sendSuccess(reply, attachments);
  });

  // GET /api/v1/documents/:id/xml - Download original XML
  fastify.get<{
    Params: DocumentIdParams;
  }>('/:id/xml', {
    schema: {
      tags: ['Documents'],
      summary: 'Download XML',
      description: 'Faz download do XML original do documento fiscal',
      params: zodToFastify(documentIdSchema),
      produces: ['application/xml'],
      response: {
        200: { type: 'string', description: 'Arquivo XML' },
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = documentIdSchema.parse(request.params);

    const xml = await documentsService.getXml(tenantId, id);

    return reply
      .header('Content-Type', 'application/xml')
      .header('Content-Disposition', `attachment; filename="${id}.xml"`)
      .send(xml);
  });

  // GET /api/v1/documents/:id/pdf - Get PDF availability metadata
  fastify.get<{
    Params: DocumentIdParams;
  }>('/:id/pdf', {
    schema: {
      tags: ['Documents'],
      summary: 'Obter disponibilidade do PDF',
      description: 'Retorna metadados para o PDF fiscal disponivel sem expor URL de storage',
      params: zodToFastify(documentIdSchema),
      response: {
        200: {
          description: 'Metadados do PDF fiscal',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                available: { type: 'boolean' },
                cached: { type: 'boolean' },
                filename: { type: 'string' },
                representation: { type: 'string' },
                downloadPath: { type: 'string' },
              },
            },
          },
        },
        400: standardResponses[400],
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = documentIdSchema.parse(request.params);

    const result = await documentsService.getPdfInfo(tenantId, id);

    return sendSuccess(reply, result);
  });

  // GET /api/v1/documents/:id/pdf/download - Download PDF directly
  fastify.get<{
    Params: DocumentIdParams;
  }>('/:id/pdf/download', {
    schema: {
      tags: ['Documents'],
      summary: 'Download PDF',
      description: 'Faz download direto do DANFE/DACTE em PDF',
      params: zodToFastify(documentIdSchema),
      produces: ['application/pdf'],
      response: {
        200: { type: 'string', description: 'Arquivo PDF' },
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const { id } = documentIdSchema.parse(request.params);

    const { buffer, filename } = await documentsService.getPdf(tenantId, id, userId);

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(buffer);
  });
}
