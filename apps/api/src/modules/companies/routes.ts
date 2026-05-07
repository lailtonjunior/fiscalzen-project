import type { FastifyInstance } from 'fastify';
import { companiesService } from './service';
import {
  createCompanySchema,
  updateCompanySchema,
  companyIdSchema,
  listCompaniesQuerySchema,
  type CreateCompanyInput,
  type UpdateCompanyInput,
  type CompanyIdParams,
  type ListCompaniesQuery,
} from './schemas';
import { getTenantId } from '../../plugins/auth';
import { sendSuccess, sendCreated, sendNoContent, paginate } from '../../utils/response';
import { ValidationError } from '../../utils/errors';
import { zodToFastify, standardResponses } from '../../utils/schema-converter';

export async function companiesRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/companies - List companies
  fastify.get<{
    Querystring: ListCompaniesQuery;
  }>('/', {
    schema: {
      tags: ['Companies'],
      summary: 'Listar empresas',
      description: 'Retorna lista paginada de empresas do usuário autenticado',
      querystring: zodToFastify(listCompaniesQuerySchema),
      response: {
        200: {
          description: 'Lista de empresas',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
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
    const query = listCompaniesQuerySchema.parse(request.query);

    const { items, total } = await companiesService.list(tenantId, query);
    const { data, pagination } = paginate(items, total, query.page, query.limit);

    return sendSuccess(reply, data, 200, pagination);
  });

  // POST /api/v1/companies - Create company
  fastify.post<{
    Body: CreateCompanyInput;
  }>('/', {
    schema: {
      tags: ['Companies'],
      summary: 'Criar empresa',
      description: 'Cadastra uma nova empresa vinculada ao usuário',
      body: zodToFastify(createCompanySchema),
      response: {
        201: {
          description: 'Empresa criada com sucesso',
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
    const data = createCompanySchema.parse(request.body);

    const company = await companiesService.create(tenantId, data);

    return sendCreated(reply, company);
  });

  // GET /api/v1/companies/:id - Get company details
  fastify.get<{
    Params: CompanyIdParams;
  }>('/:id', {
    schema: {
      tags: ['Companies'],
      summary: 'Obter empresa',
      description: 'Retorna detalhes de uma empresa específica',
      params: zodToFastify(companyIdSchema),
      response: {
        200: {
          description: 'Detalhes da empresa',
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
    const { id } = companyIdSchema.parse(request.params);

    const company = await companiesService.getById(tenantId, id);

    return sendSuccess(reply, company);
  });

  // PUT /api/v1/companies/:id - Update company
  fastify.put<{
    Params: CompanyIdParams;
    Body: UpdateCompanyInput;
  }>('/:id', {
    schema: {
      tags: ['Companies'],
      summary: 'Atualizar empresa',
      description: 'Atualiza dados de uma empresa existente',
      params: zodToFastify(companyIdSchema),
      body: zodToFastify(updateCompanySchema),
      response: {
        200: {
          description: 'Empresa atualizada',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', additionalProperties: true },
          },
        },
        400: standardResponses[400],
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = companyIdSchema.parse(request.params);
    const data = updateCompanySchema.parse(request.body);

    const company = await companiesService.update(tenantId, id, data);

    return sendSuccess(reply, company);
  });

  // DELETE /api/v1/companies/:id - Soft delete company
  fastify.delete<{
    Params: CompanyIdParams;
  }>('/:id', {
    schema: {
      tags: ['Companies'],
      summary: 'Desativar empresa',
      description: 'Desativa uma empresa (soft delete)',
      params: zodToFastify(companyIdSchema),
      response: {
        204: {
          type: 'null',
          description: 'Empresa desativada',
        },
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = companyIdSchema.parse(request.params);

    await companiesService.disable(tenantId, id);

    return sendNoContent(reply);
  });

  // POST /api/v1/companies/:id/certificate - Upload certificate
  fastify.post<{
    Params: CompanyIdParams;
  }>('/:id/certificate', {
    schema: {
      tags: ['Companies'],
      summary: 'Upload de certificado',
      description: 'Faz upload do certificado digital A1 (.pfx) para a empresa',
      params: zodToFastify(companyIdSchema),
      consumes: ['multipart/form-data'],
      response: {
        200: {
          description: 'Certificado enviado com sucesso',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                validFrom: { type: 'string' },
                validTo: { type: 'string' },
                subject: { type: 'string' },
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
    const { id } = companyIdSchema.parse(request.params);

    // Handle multipart upload
    const data = await request.file();

    if (!data) {
      throw new ValidationError('Arquivo de certificado nao enviado');
    }

    // Get password from field
    const fields = data.fields as Record<string, { value?: string }>;
    const password = fields.password?.value;

    if (!password) {
      throw new ValidationError('Senha do certificado e obrigatoria');
    }

    // Get file buffer
    const pfxBuffer = await data.toBuffer();

    const result = await companiesService.uploadCertificate(tenantId, id, pfxBuffer, password);

    return sendSuccess(reply, result);
  });

  // GET /api/v1/companies/:id/nsu-status - Get NSU sync status
  fastify.get<{
    Params: CompanyIdParams;
  }>('/:id/nsu-status', {
    schema: {
      tags: ['Companies'],
      summary: 'Status de sincronização NSU',
      description: 'Retorna o status de sincronização do NSU (Número Sequencial Único) da empresa',
      params: zodToFastify(companyIdSchema),
      response: {
        200: {
          description: 'Status do NSU',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  docType: { type: 'string' },
                  lastNsu: { type: 'string' },
                  maxNsu: { type: 'string', nullable: true },
                  lastSync: { type: 'string', nullable: true },
                  nextSync: { type: 'string', nullable: true },
                  syncStatus: { type: 'string' },
                  errorCount: { type: 'integer' },
                  lastError: { type: 'string', nullable: true },
                },
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
    const { id } = companyIdSchema.parse(request.params);

    const status = await companiesService.getNsuStatus(tenantId, id);

    return sendSuccess(reply, status);
  });
}
