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
import { zodToFastify, standardResponses } from '../../utils/schema-converter';

export async function nfseRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/nfse/municipios - List all supported municipalities
  fastify.get('/municipios', {
    schema: {
      tags: ['NFS-e'],
      summary: 'Listar municípios suportados',
      description: 'Retorna a lista de municípios suportados para emissão de NFS-e',
      response: {
        200: {
          description: 'Lista de municípios',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (_request, reply) => {
    const municipios = await nfseService.getMunicipios();
    return sendSuccess(reply, municipios);
  });

  // GET /api/v1/nfse/municipios/:codigo - Get municipality info
  fastify.get<{
    Params: { codigo: string };
  }>('/municipios/:codigo', {
    schema: {
      tags: ['NFS-e'],
      summary: 'Detalhes do município',
      description: 'Retorna informações de um município específico',
      params: {
        type: 'object',
        properties: { codigo: { type: 'string' } },
      },
      response: {
        200: {
          description: 'Detalhes do município',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const municipio = await nfseService.getMunicipio(request.params.codigo);
    return sendSuccess(reply, municipio);
  });
}

export async function companyNfseRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/companies/:companyId/nfse - List company NFSe configs
  fastify.get<{
    Params: CompanyIdParams;
  }>('/', {
    schema: {
      tags: ['NFS-e Configurações'],
      summary: 'Listar configurações NFS-e',
      description: 'Lista configurações de NFS-e da empresa',
      params: zodToFastify(companyIdSchema),
      response: {
        200: {
          description: 'Lista de configurações',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId } = companyIdSchema.parse(request.params);

    const configs = await nfseService.getConfigs(tenantId, companyId);
    return sendSuccess(reply, configs);
  });

  // POST /api/v1/companies/:companyId/nfse - Create NFSe config
  fastify.post<{
    Params: CompanyIdParams;
    Body: CreateNfseConfigInput;
  }>('/', {
    schema: {
      tags: ['NFS-e Configurações'],
      summary: 'Criar configuração NFS-e',
      description: 'Configura emissão de NFS-e para um município na empresa',
      params: zodToFastify(companyIdSchema),
      body: zodToFastify(createNfseConfigSchema),
      response: {
        201: {
          description: 'Configuração criada',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        400: standardResponses[400],
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId } = companyIdSchema.parse(request.params);
    const data = createNfseConfigSchema.parse(request.body);

    const config = await nfseService.createConfig(tenantId, companyId, data);
    return sendCreated(reply, config);
  });

  // GET /api/v1/companies/:companyId/nfse/:codigoMunicipio - Get NFSe config
  fastify.get<{
    Params: MunicipioCodigoParams;
  }>('/:codigoMunicipio', {
    schema: {
      tags: ['NFS-e Configurações'],
      summary: 'Obter configuração NFS-e',
      description: 'Retorna configuração de NFS-e de um município específico',
      params: zodToFastify(municipioCodigoSchema),
      response: {
        200: {
          description: 'Configuração NFS-e',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId, codigoMunicipio } = municipioCodigoSchema.parse(request.params);

    const config = await nfseService.getConfig(tenantId, companyId, codigoMunicipio);
    return sendSuccess(reply, config);
  });

  // PATCH /api/v1/companies/:companyId/nfse/:codigoMunicipio - Update NFSe config
  fastify.patch<{
    Params: MunicipioCodigoParams;
    Body: UpdateNfseConfigInput;
  }>('/:codigoMunicipio', {
    schema: {
      tags: ['NFS-e Configurações'],
      summary: 'Atualizar configuração NFS-e',
      description: 'Atualiza credenciais ou configurações de NFS-e',
      params: zodToFastify(municipioCodigoSchema),
      body: zodToFastify(updateNfseConfigSchema),
      response: {
        200: {
          description: 'Configuração atualizada',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        400: standardResponses[400],
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId, codigoMunicipio } = municipioCodigoSchema.parse(request.params);
    const data = updateNfseConfigSchema.parse(request.body);

    const config = await nfseService.updateConfig(tenantId, companyId, codigoMunicipio, data);
    return sendSuccess(reply, config);
  });

  // DELETE /api/v1/companies/:companyId/nfse/:codigoMunicipio - Delete NFSe config
  fastify.delete<{
    Params: MunicipioCodigoParams;
  }>('/:codigoMunicipio', {
    schema: {
      tags: ['NFS-e Configurações'],
      summary: 'Excluir configuração NFS-e',
      description: 'Remove a configuração de NFS-e para o município',
      params: zodToFastify(municipioCodigoSchema),
      response: {
        204: standardResponses[204],
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId, codigoMunicipio } = municipioCodigoSchema.parse(request.params);

    await nfseService.deleteConfig(tenantId, companyId, codigoMunicipio);
    return sendNoContent(reply);
  });

  // PATCH /api/v1/companies/:companyId/nfse/:codigoMunicipio/toggle - Toggle NFSe config
  fastify.patch<{
    Params: MunicipioCodigoParams;
    Body: ToggleNfseConfigInput;
  }>('/:codigoMunicipio/toggle', {
    schema: {
      tags: ['NFS-e Configurações'],
      summary: 'Ativar/Desativar NFS-e',
      description: 'Ativa ou desativa a emissão de NFS-e para o município',
      params: zodToFastify(municipioCodigoSchema),
      body: zodToFastify(toggleNfseConfigSchema),
      response: {
        200: {
          description: 'Status atualizado',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        400: standardResponses[400],
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId, codigoMunicipio } = municipioCodigoSchema.parse(request.params);
    const { isActive } = toggleNfseConfigSchema.parse(request.body);

    const config = await nfseService.toggleConfig(tenantId, companyId, codigoMunicipio, isActive);
    return sendSuccess(reply, config);
  });

  // POST /api/v1/companies/:companyId/nfse/:codigoMunicipio/test - Test NFSe connection
  fastify.post<{
    Params: MunicipioCodigoParams;
  }>('/:codigoMunicipio/test', {
    schema: {
      tags: ['NFS-e Configurações'],
      summary: 'Testar conexão NFS-e',
      description: 'Testa a comunicação com a prefeitura usando as credenciais',
      params: zodToFastify(municipioCodigoSchema),
      response: {
        200: {
          description: 'Resultado do teste',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId, codigoMunicipio } = municipioCodigoSchema.parse(request.params);

    const result = await nfseService.testConnection(tenantId, companyId, codigoMunicipio);
    return sendSuccess(reply, result);
  });

  // POST /api/v1/companies/:companyId/nfse/:codigoMunicipio/sync - Trigger NFSe sync
  fastify.post<{
    Params: MunicipioCodigoParams;
  }>('/:codigoMunicipio/sync', {
    schema: {
      tags: ['NFS-e Configurações'],
      summary: 'Sincronizar NFS-e',
      description: 'Dispara sincronização manual de notas fiscais com a prefeitura',
      params: zodToFastify(municipioCodigoSchema),
      response: {
        200: {
          description: 'Sincronização iniciada',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId, codigoMunicipio } = municipioCodigoSchema.parse(request.params);

    const result = await nfseService.triggerSync(tenantId, companyId, codigoMunicipio);
    return sendSuccess(reply, result);
  });
}
