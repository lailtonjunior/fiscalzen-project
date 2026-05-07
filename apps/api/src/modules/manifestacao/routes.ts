import type { FastifyInstance } from 'fastify';
import { manifestacaoService } from './service';
import {
  cienciaSchema,
  confirmacaoSchema,
  desconhecimentoSchema,
  manifestacaoDocumentParamsSchema,
  manifestacaoHistoryQuerySchema,
  manifestacaoSubmitSchema,
  naoRealizadaSchema,
  desacordoSchema,
  pendentesQuerySchema,
  type CienciaInput,
  type ConfirmacaoInput,
  type DesconhecimentoInput,
  type ManifestacaoDocumentParams,
  type ManifestacaoHistoryQuery,
  type ManifestacaoSubmitInput,
  type NaoRealizadaInput,
  type DesacordoInput,
  type PendentesQuery,
} from './schemas';
import { getTenantId, getUserId } from '../../plugins/auth';
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
    const userId = getUserId(request);
    const { chNFe, companyId } = cienciaSchema.parse(request.body);

    const result = await manifestacaoService.registrarCiencia(tenantId, companyId, chNFe, userId);

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
    const userId = getUserId(request);
    const { chNFe, companyId } = confirmacaoSchema.parse(request.body);

    const result = await manifestacaoService.confirmarOperacao(tenantId, companyId, chNFe, userId);

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
    const userId = getUserId(request);
    const { chNFe, companyId } = desconhecimentoSchema.parse(request.body);

    const result = await manifestacaoService.desconhecerOperacao(tenantId, companyId, chNFe, userId);

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
    const userId = getUserId(request);
    const { chNFe, companyId, justificativa } = naoRealizadaSchema.parse(request.body);

    const result = await manifestacaoService.operacaoNaoRealizada(
      tenantId,
      companyId,
      chNFe,
      justificativa,
      userId
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
    const userId = getUserId(request);
    const { chCTe, companyId, observacao, indDesacordoOper } = desacordoSchema.parse(request.body);

    const result = await manifestacaoService.registrarDesacordo(
      tenantId,
      companyId,
      chCTe,
      observacao,
      indDesacordoOper,
      userId
    );

    return sendSuccess(reply, result);
  });

  fastify.post<{
    Params: ManifestacaoDocumentParams;
    Body: ManifestacaoSubmitInput;
  }>('/:documentId', {
    schema: {
      tags: ['Manifestação'],
      summary: 'Manifestar documento',
      description: 'Executa uma tentativa operacional de manifestacao do destinatario para o documento informado',
      params: zodToFastify(manifestacaoDocumentParamsSchema),
      body: zodToFastify(manifestacaoSubmitSchema),
      response: {
        200: {
          description: 'Manifestacao processada',
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
    const userId = getUserId(request);
    const { documentId } = manifestacaoDocumentParamsSchema.parse(request.params);
    const body = manifestacaoSubmitSchema.parse(request.body);

    const result = await manifestacaoService.manifestarDocumento(tenantId, documentId, body, userId);
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

  fastify.get<{
    Querystring: PendentesQuery;
  }>('/awaiting-final', {
    schema: {
      tags: ['Manifestação'],
      summary: 'Aguardando manifestacao final',
      description: 'Lista documentos que ja possuem ciencia da operacao e aguardam manifestacao final',
      querystring: zodToFastify(pendentesQuerySchema),
      response: {
        200: {
          description: 'Lista de documentos aguardando manifestacao final',
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
    const { items, total } = await manifestacaoService.getAwaitingFinal(tenantId, query);
    const { data, pagination } = paginate(items, total, query.page, query.limit);
    return sendSuccess(reply, data, 200, pagination);
  });

  // GET /api/v1/manifestacao/pending - Compatibility alias for pending documents
  fastify.get<{
    Querystring: PendentesQuery;
  }>('/pending', {
    schema: {
      tags: ['Manifestação'],
      summary: 'Documentos pendentes (alias)',
      description: 'Alias compatível para listar documentos aguardando manifestação',
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

  // GET /api/v1/manifestacao/count - Count documents awaiting manifestation
  fastify.get<{
    Querystring: Pick<PendentesQuery, 'companyId'>;
  }>('/count', {
    schema: {
      tags: ['Manifestação'],
      summary: 'Contagem de pendências',
      description: 'Retorna a quantidade de documentos aguardando manifestação',
      querystring: zodToFastify(pendentesQuerySchema.pick({ companyId: true })),
      response: {
        200: {
          description: 'Contagem de pendências',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                count: { type: 'integer' },
                pendingCiencia: { type: 'integer' },
                awaitingFinal: { type: 'integer' },
                total: { type: 'integer' },
              },
            },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = pendentesQuerySchema.pick({ companyId: true }).parse(request.query);
    const counts = await manifestacaoService.getCounts(tenantId, query.companyId);

    return sendSuccess(reply, { count: counts.total, ...counts });
  });

  fastify.get<{
    Querystring: ManifestacaoHistoryQuery;
  }>('/history', {
    schema: {
      tags: ['Manifestação'],
      summary: 'Historico de manifestacoes',
      description: 'Lista manifestacoes concluidas ou com erro para o tenant autenticado',
      querystring: zodToFastify(manifestacaoHistoryQuerySchema),
      response: {
        200: {
          description: 'Historico de manifestacoes',
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
    const query = manifestacaoHistoryQuerySchema.parse(request.query);
    const { items, total } = await manifestacaoService.getHistory(tenantId, query);
    const { data, pagination } = paginate(items, total, query.page, query.limit);
    return sendSuccess(reply, data, 200, pagination);
  });
}
