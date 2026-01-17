import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { companiesService } from './service';
import {
  createCompanySchema,
  updateCompanySchema,
  companyIdSchema,
  uploadCertificateSchema,
  listCompaniesQuerySchema,
  type CreateCompanyInput,
  type UpdateCompanyInput,
  type CompanyIdParams,
  type ListCompaniesQuery,
} from './schemas';
import { getTenantId } from '../../plugins/auth';
import { sendSuccess, sendCreated, sendNoContent, paginate } from '../../utils/response';
import { ValidationError } from '../../utils/errors';

export async function companiesRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/companies - List companies
  fastify.get<{
    Querystring: ListCompaniesQuery;
  }>('/', async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = listCompaniesQuerySchema.parse(request.query);

    const { items, total } = await companiesService.list(tenantId, query);
    const { data, pagination } = paginate(items, total, query.page, query.limit);

    return sendSuccess(reply, data, 200, pagination);
  });

  // POST /api/v1/companies - Create company
  fastify.post<{
    Body: CreateCompanyInput;
  }>('/', async (request, reply) => {
    const tenantId = getTenantId(request);
    const data = createCompanySchema.parse(request.body);

    const company = await companiesService.create(tenantId, data);

    return sendCreated(reply, company);
  });

  // GET /api/v1/companies/:id - Get company details
  fastify.get<{
    Params: CompanyIdParams;
  }>('/:id', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = companyIdSchema.parse(request.params);

    const company = await companiesService.getById(tenantId, id);

    return sendSuccess(reply, company);
  });

  // PUT /api/v1/companies/:id - Update company
  fastify.put<{
    Params: CompanyIdParams;
    Body: UpdateCompanyInput;
  }>('/:id', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = companyIdSchema.parse(request.params);
    const data = updateCompanySchema.parse(request.body);

    const company = await companiesService.update(tenantId, id, data);

    return sendSuccess(reply, company);
  });

  // DELETE /api/v1/companies/:id - Soft delete company
  fastify.delete<{
    Params: CompanyIdParams;
  }>('/:id', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = companyIdSchema.parse(request.params);

    await companiesService.disable(tenantId, id);

    return sendNoContent(reply);
  });

  // POST /api/v1/companies/:id/certificate - Upload certificate
  fastify.post<{
    Params: CompanyIdParams;
  }>('/:id/certificate', async (request, reply) => {
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
  }>('/:id/nsu-status', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = companyIdSchema.parse(request.params);

    const status = await companiesService.getNsuStatus(tenantId, id);

    return sendSuccess(reply, status);
  });
}
