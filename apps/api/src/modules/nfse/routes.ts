import type { FastifyInstance } from 'fastify';
import { nfseService } from './service';
import {
  companyIdSchema,
  municipioCodigoSchema,
  createNfseConfigSchema,
  updateNfseConfigSchema,
  toggleNfseConfigSchema,
  type CompanyIdParams,
  type MunicipioCodigoParams,
  type CreateNfseConfigInput,
  type UpdateNfseConfigInput,
  type ToggleNfseConfigInput,
} from './schemas';
import { getTenantId } from '../../plugins/auth';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response';

export async function nfseRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // ============================================
  // Municipality Routes (Public Info)
  // ============================================

  // GET /api/v1/nfse/municipios - List all supported municipalities
  fastify.get('/municipios', async (_request, reply) => {
    const municipios = await nfseService.getMunicipios();
    return sendSuccess(reply, municipios);
  });

  // GET /api/v1/nfse/municipios/:codigo - Get municipality info
  fastify.get<{
    Params: { codigo: string };
  }>('/municipios/:codigo', async (request, reply) => {
    const municipio = await nfseService.getMunicipio(request.params.codigo);
    return sendSuccess(reply, municipio);
  });
}

export async function companyNfseRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // ============================================
  // Company NFSe Config Routes
  // ============================================

  // GET /api/v1/companies/:companyId/nfse - List company NFSe configs
  fastify.get<{
    Params: CompanyIdParams;
  }>('/', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId } = companyIdSchema.parse(request.params);

    const configs = await nfseService.getConfigs(tenantId, companyId);
    return sendSuccess(reply, configs);
  });

  // POST /api/v1/companies/:companyId/nfse - Create NFSe config
  fastify.post<{
    Params: CompanyIdParams;
    Body: CreateNfseConfigInput;
  }>('/', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId } = companyIdSchema.parse(request.params);
    const data = createNfseConfigSchema.parse(request.body);

    const config = await nfseService.createConfig(tenantId, companyId, data);
    return sendCreated(reply, config);
  });

  // GET /api/v1/companies/:companyId/nfse/:codigoMunicipio - Get NFSe config
  fastify.get<{
    Params: MunicipioCodigoParams;
  }>('/:codigoMunicipio', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId, codigoMunicipio } = municipioCodigoSchema.parse(request.params);

    const config = await nfseService.getConfig(tenantId, companyId, codigoMunicipio);
    return sendSuccess(reply, config);
  });

  // PATCH /api/v1/companies/:companyId/nfse/:codigoMunicipio - Update NFSe config
  fastify.patch<{
    Params: MunicipioCodigoParams;
    Body: UpdateNfseConfigInput;
  }>('/:codigoMunicipio', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId, codigoMunicipio } = municipioCodigoSchema.parse(request.params);
    const data = updateNfseConfigSchema.parse(request.body);

    const config = await nfseService.updateConfig(tenantId, companyId, codigoMunicipio, data);
    return sendSuccess(reply, config);
  });

  // DELETE /api/v1/companies/:companyId/nfse/:codigoMunicipio - Delete NFSe config
  fastify.delete<{
    Params: MunicipioCodigoParams;
  }>('/:codigoMunicipio', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId, codigoMunicipio } = municipioCodigoSchema.parse(request.params);

    await nfseService.deleteConfig(tenantId, companyId, codigoMunicipio);
    return sendNoContent(reply);
  });

  // PATCH /api/v1/companies/:companyId/nfse/:codigoMunicipio/toggle - Toggle NFSe config
  fastify.patch<{
    Params: MunicipioCodigoParams;
    Body: ToggleNfseConfigInput;
  }>('/:codigoMunicipio/toggle', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId, codigoMunicipio } = municipioCodigoSchema.parse(request.params);
    const { isActive } = toggleNfseConfigSchema.parse(request.body);

    const config = await nfseService.toggleConfig(tenantId, companyId, codigoMunicipio, isActive);
    return sendSuccess(reply, config);
  });

  // POST /api/v1/companies/:companyId/nfse/:codigoMunicipio/test - Test NFSe connection
  fastify.post<{
    Params: MunicipioCodigoParams;
  }>('/:codigoMunicipio/test', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId, codigoMunicipio } = municipioCodigoSchema.parse(request.params);

    const result = await nfseService.testConnection(tenantId, companyId, codigoMunicipio);
    return sendSuccess(reply, result);
  });

  // POST /api/v1/companies/:companyId/nfse/:codigoMunicipio/sync - Trigger NFSe sync
  fastify.post<{
    Params: MunicipioCodigoParams;
  }>('/:codigoMunicipio/sync', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId, codigoMunicipio } = municipioCodigoSchema.parse(request.params);

    const result = await nfseService.triggerSync(tenantId, companyId, codigoMunicipio);
    return sendSuccess(reply, result);
  });
}
