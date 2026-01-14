import type { FastifyInstance } from 'fastify';
import { manifestacaoService } from './service.js';
import {
  cienciaSchema,
  confirmacaoSchema,
  desconhecimentoSchema,
  naoRealizadaSchema,
  pendentesQuerySchema,
  type CienciaInput,
  type ConfirmacaoInput,
  type DesconhecimentoInput,
  type NaoRealizadaInput,
  type PendentesQuery,
} from './schemas.js';
import { getTenantId } from '../../plugins/auth.js';
import { sendSuccess, paginate } from '../../utils/response.js';

export async function manifestacaoRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // POST /api/v1/manifestacao/ciencia - Registrar ciencia da emissao (210210)
  fastify.post<{
    Body: CienciaInput;
  }>('/ciencia', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { chNFe, companyId } = cienciaSchema.parse(request.body);

    const result = await manifestacaoService.registrarCiencia(tenantId, companyId, chNFe);

    return sendSuccess(reply, result);
  });

  // POST /api/v1/manifestacao/confirmacao - Confirmar operacao (210200)
  fastify.post<{
    Body: ConfirmacaoInput;
  }>('/confirmacao', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { chNFe, companyId } = confirmacaoSchema.parse(request.body);

    const result = await manifestacaoService.confirmarOperacao(tenantId, companyId, chNFe);

    return sendSuccess(reply, result);
  });

  // POST /api/v1/manifestacao/desconhecimento - Desconhecer operacao (210220)
  fastify.post<{
    Body: DesconhecimentoInput;
  }>('/desconhecimento', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { chNFe, companyId } = desconhecimentoSchema.parse(request.body);

    const result = await manifestacaoService.desconhecerOperacao(tenantId, companyId, chNFe);

    return sendSuccess(reply, result);
  });

  // POST /api/v1/manifestacao/nao-realizada - Operacao nao realizada (210240)
  fastify.post<{
    Body: NaoRealizadaInput;
  }>('/nao-realizada', async (request, reply) => {
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

  // GET /api/v1/manifestacao/pendentes - Documentos aguardando manifestacao
  fastify.get<{
    Querystring: PendentesQuery;
  }>('/pendentes', async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = pendentesQuerySchema.parse(request.query);

    const { items, total } = await manifestacaoService.getPendentes(tenantId, query);
    const { data, pagination } = paginate(items, total, query.page, query.limit);

    return sendSuccess(reply, data, 200, pagination);
  });
}
