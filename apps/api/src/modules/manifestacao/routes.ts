import type { FastifyInstance } from 'fastify';
import { manifestacaoService } from './service';
import {
  cienciaSchema,
  confirmacaoSchema,
  desconhecimentoSchema,
  naoRealizadaSchema,
  desacordoSchema,
  pendentesQuerySchema,
  type CienciaInput,
  type ConfirmacaoInput,
  type DesconhecimentoInput,
  type NaoRealizadaInput,
  type DesacordoInput,
  type PendentesQuery,
} from './schemas';
import { getTenantId } from '../../plugins/auth';
import { sendSuccess, paginate } from '../../utils/response';
import { zodToFastify, standardResponses } from '../../utils/schema-converter';

export async function manifestacaoRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // POST /api/v1/manifestacao/ciencia - Registrar ciencia da emissao (210210)
  fastify.post<{
    Body: CienciaInput;
  }>('/ciencia', {
    schema: {
      tags: ['Manifestação'],
      summary: 'Registrar ciência',
      description: 'Registra ciência da operação no evento 210210 (NF-e)',
      body: zodToFastify(cienciaSchema),
      response: {
        200: {
          description: 'Ciência registrada com sucesso',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                protocolo: { type: 'string' },
                dataRegistro: { type: 'string' },
              },
            },
          },
        },
        400: standardResponses[400],
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { chNFe, companyId } = cienciaSchema.parse(request.body);

    const result = await manifestacaoService.registrarCiencia(tenantId, companyId, chNFe);

    return sendSuccess(reply, result);
  });

  // POST /api/v1/manifestacao/confirmacao - Confirmar operacao (210200)
  fastify.post<{
    Body: ConfirmacaoInput;
  }>('/confirmacao', {
    schema: {
      tags: ['Manifestação'],
      summary: 'Confirmar operação',
      description: 'Confirma a operação no evento 210200 (NF-e)',
      body: zodToFastify(confirmacaoSchema),
      response: {
        200: {
          description: 'Operação confirmada',
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
    const { chNFe, companyId } = confirmacaoSchema.parse(request.body);

    const result = await manifestacaoService.confirmarOperacao(tenantId, companyId, chNFe);

    return sendSuccess(reply, result);
  });

  // POST /api/v1/manifestacao/desconhecimento - Desconhecer operacao (210220)
  fastify.post<{
    Body: DesconhecimentoInput;
  }>('/desconhecimento', {
    schema: {
      tags: ['Manifestação'],
      summary: 'Desconhecer operação',
      description: 'Registra desconhecimento da operação no evento 210220 (NF-e)',
      body: zodToFastify(desconhecimentoSchema),
      response: {
        200: {
          description: 'Desconhecimento registrado',
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
    const { chNFe, companyId } = desconhecimentoSchema.parse(request.body);

    const result = await manifestacaoService.desconhecerOperacao(tenantId, companyId, chNFe);

    return sendSuccess(reply, result);
  });

  // POST /api/v1/manifestacao/nao-realizada - Operacao nao realizada (210240)
  fastify.post<{
    Body: NaoRealizadaInput;
  }>('/nao-realizada', {
    schema: {
      tags: ['Manifestação'],
      summary: 'Operação não realizada',
      description: 'Registra que a operação não foi realizada (evento 210240)',
      body: zodToFastify(naoRealizadaSchema),
      response: {
        200: {
          description: 'Registro realizado',
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
    const { chNFe, companyId, justificativa } = naoRealizadaSchema.parse(request.body);

    const result = await manifestacaoService.operacaoNaoRealizada(
      tenantId,
      companyId,
      chNFe,
      justificativa
    );

    return sendSuccess(reply, result);
  });

  // POST /api/v1/manifestacao/cte/desacordo - Prestacao em Desacordo (610110)
  fastify.post<{
    Body: DesacordoInput;
  }>('/cte/desacordo', {
    schema: {
      tags: ['Manifestação'],
      summary: 'Prestação em desacordo (CT-e)',
      description: 'Registra prestação em desacordo para CT-e (evento 610110)',
      body: zodToFastify(desacordoSchema),
      response: {
        200: {
          description: 'Desacordo registrado',
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
    const { chCTe, companyId, observacao, indDesacordoOper } = desacordoSchema.parse(request.body);

    const result = await manifestacaoService.registrarDesacordo(
      tenantId,
      companyId,
      chCTe,
      observacao,
      indDesacordoOper
    );

    return sendSuccess(reply, result);
  });

  // GET /api/v1/manifestacao/pendentes - Documentos aguardando manifestacao
  fastify.get<{
    Querystring: PendentesQuery;
  }>('/pendentes', {
    schema: {
      tags: ['Manifestação'],
      summary: 'Documentos pendentes',
      description: 'Lista documentos aguardando manifestação do destinatário',
      querystring: zodToFastify(pendentesQuerySchema),
      response: {
        200: {
          description: 'Lista de documentos pendentes',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            pagination: { type: 'object' },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = pendentesQuerySchema.parse(request.query);

    const { items, total } = await manifestacaoService.getPendentes(tenantId, query);
    const { data, pagination } = paginate(items, total, query.page, query.limit);

    return sendSuccess(reply, data, 200, pagination);
  });
}
