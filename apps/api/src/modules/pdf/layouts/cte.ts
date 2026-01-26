import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import type { CTeData } from '@fiscalzen/xml-parser';
import {
  formatCnpjCpf,
  formatChaveAcesso,
  formatCurrency,
  formatNumero,
  formatSerie,
  formatDate,
  formatDateTime,
  getModalTransporte,
  getTipoCTe,
  getTipoServico,
} from '../utils/formatters';

// ============================================
// DACTE - Documento Auxiliar do CTe
// Layout seguindo especificacoes oficiais
// ============================================

export interface DacteLayoutOptions {
  barcodeBase64: string;
  qrCodeBase64?: string;
}

export async function getCTeLayout(
  data: CTeData,
  options: DacteLayoutOptions
): Promise<TDocumentDefinitions> {
  const { barcodeBase64, qrCodeBase64 } = options;

  return {
    pageSize: 'A4',
    pageMargins: [15, 15, 15, 15],
    defaultStyle: {
      fontSize: 7,
    },
    styles: {
      dacteTitle: { fontSize: 11, bold: true },
      sectionTitle: { fontSize: 6, bold: true, fillColor: '#E8E8E8' },
      label: { fontSize: 5, color: '#444444' },
      value: { fontSize: 7 },
      valueBold: { fontSize: 7, bold: true },
      small: { fontSize: 5 },
      chave: { fontSize: 6, characterSpacing: 0.5 },
      numero: { fontSize: 9, bold: true },
    },
    content: [
      // ========================================
      // CABECALHO PRINCIPAL
      // ========================================
      createHeader(data, barcodeBase64, qrCodeBase64),

      // ========================================
      // MODAL E TIPO DE SERVICO
      // ========================================
      createModalSection(data),

      // ========================================
      // REMETENTE
      // ========================================
      createRemetenteSection(data),

      // ========================================
      // DESTINATARIO
      // ========================================
      createDestinatarioSection(data),

      // ========================================
      // EXPEDIDOR / RECEBEDOR (simplificado)
      // ========================================

      // ========================================
      // TOMADOR DO SERVICO
      // ========================================
      createTomadorSection(data),

      // ========================================
      // PRODUTO PREDOMINANTE
      // ========================================
      createProdutoSection(data),

      // ========================================
      // COMPONENTES DO VALOR DA PRESTACAO
      // ========================================
      createValorSection(data),

      // ========================================
      // INFORMACOES DO CT-e
      // ========================================
      createInfoSection(data),
    ],
  };
}

function createHeader(data: CTeData, barcodeBase64: string, qrCodeBase64?: string): Content {
  return {
    table: {
      widths: ['30%', '18%', qrCodeBase64 ? '37%' : '52%', ...(qrCodeBase64 ? ['15%'] : [])],
      heights: [75],
      body: [
        [
          // Coluna 1: Dados do Emitente
          {
            stack: [
              { text: data.emitente.razaoSocial, fontSize: 8, bold: true, margin: [0, 0, 0, 3] },
              { text: `CNPJ: ${formatCnpjCpf(data.emitente.cnpj)}`, style: 'small' },
              { text: `UF: ${data.emitente.uf || ''}`, style: 'small' },
            ],
            margin: [3, 3, 3, 3],
          },
          // Coluna 2: DACTE
          {
            stack: [
              { text: 'DACTE', style: 'dacteTitle', alignment: 'center' },
              { text: 'Documento Auxiliar do', style: 'small', alignment: 'center' },
              { text: 'Conhecimento de', style: 'small', alignment: 'center' },
              { text: 'Transporte Eletronico', style: 'small', alignment: 'center' },
              { text: ' ', fontSize: 3 },
              { text: `No ${formatNumero(data.numero)}`, style: 'numero', alignment: 'center' },
              { text: `Serie ${formatSerie(data.serie)}`, style: 'small', alignment: 'center' },
            ],
            margin: [3, 3, 3, 3],
          },
          // Coluna 3: Codigo de Barras + Chave
          {
            stack: [
              { image: barcodeBase64, width: 180, height: 30, alignment: 'center' },
              { text: ' ', fontSize: 2 },
              { text: 'CHAVE DE ACESSO', style: 'label', alignment: 'center' },
              { text: formatChaveAcesso(data.chave), style: 'chave', alignment: 'center' },
              { text: ' ', fontSize: 2 },
              {
                text: `Protocolo: ${data.metadata.protocolo || ''}`,
                style: 'small',
                alignment: 'center',
              },
            ],
            margin: [3, 3, 3, 3],
          },
          // Coluna 4: QR Code (se houver)
          ...(qrCodeBase64
            ? [
                {
                  image: qrCodeBase64,
                  width: 70,
                  height: 70,
                  alignment: 'center' as const,
                  margin: [3, 3, 3, 3] as [number, number, number, number],
                },
              ]
            : []),
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
    },
  };
}

function createModalSection(data: CTeData): Content {
  const modal = getModalTransporte(data.metadata.modal as string);
  const tipoCTe = getTipoCTe(data.metadata.tpCTe as string);
  const tipoServ = getTipoServico(data.metadata.tpServ as string);

  return {
    margin: [0, 5, 0, 0],
    table: {
      widths: ['*', '*', '*', '*'],
      body: [
        [
          {
            stack: [
              { text: 'MODAL', style: 'label' },
              { text: modal, style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
          {
            stack: [
              { text: 'TIPO CT-e', style: 'label' },
              { text: tipoCTe, style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
          {
            stack: [
              { text: 'TIPO SERVICO', style: 'label' },
              { text: tipoServ, style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
          {
            stack: [
              { text: 'DATA EMISSAO', style: 'label' },
              { text: formatDate(data.dataEmissao), style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
    },
  };
}

function createRemetenteSection(data: CTeData): Content {
  return {
    margin: [0, 5, 0, 0],
    table: {
      widths: ['*', 130],
      body: [
        [
          { text: 'REMETENTE', style: 'sectionTitle', colSpan: 2, margin: [3, 2, 3, 2] },
          {},
        ],
        [
          {
            stack: [
              { text: 'NOME / RAZAO SOCIAL', style: 'label' },
              { text: data.remetente.razaoSocial || '', style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
          {
            stack: [
              { text: 'CNPJ / CPF', style: 'label' },
              { text: formatCnpjCpf(data.remetente.cnpjCpf || ''), style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
    },
  };
}

function createDestinatarioSection(data: CTeData): Content {
  return {
    margin: [0, 5, 0, 0],
    table: {
      widths: ['*', 130],
      body: [
        [
          { text: 'DESTINATARIO', style: 'sectionTitle', colSpan: 2, margin: [3, 2, 3, 2] },
          {},
        ],
        [
          {
            stack: [
              { text: 'NOME / RAZAO SOCIAL', style: 'label' },
              { text: data.destinatario.razaoSocial || '', style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
          {
            stack: [
              { text: 'CNPJ / CPF', style: 'label' },
              { text: formatCnpjCpf(data.destinatario.cnpjCpf || ''), style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
    },
  };
}

function createTomadorSection(data: CTeData): Content {
  return {
    margin: [0, 5, 0, 0],
    table: {
      widths: ['*'],
      body: [
        [{ text: 'TOMADOR DO SERVICO', style: 'sectionTitle', margin: [3, 2, 3, 2] }],
        [
          {
            text: 'Conforme indicado no documento fiscal',
            style: 'small',
            margin: [3, 3, 3, 3],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
    },
  };
}

function createProdutoSection(data: CTeData): Content {
  const ufInicio = data.metadata.ufInicio || '';
  const ufFim = data.metadata.ufFim || '';
  const natOp = data.metadata.natOp || '';

  return {
    margin: [0, 5, 0, 0],
    table: {
      widths: ['*', '*', '*'],
      body: [
        [
          { text: 'INFORMACOES DA PRESTACAO', style: 'sectionTitle', colSpan: 3, margin: [3, 2, 3, 2] },
          {},
          {},
        ],
        [
          {
            stack: [
              { text: 'INICIO DA PRESTACAO', style: 'label' },
              { text: String(ufInicio), style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
          {
            stack: [
              { text: 'FIM DA PRESTACAO', style: 'label' },
              { text: String(ufFim), style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
          {
            stack: [
              { text: 'NATUREZA DA OPERACAO', style: 'label' },
              { text: String(natOp), style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
    },
  };
}

function createValorSection(data: CTeData): Content {
  return {
    margin: [0, 5, 0, 0],
    table: {
      widths: ['*', '*'],
      body: [
        [
          { text: 'COMPONENTES DO VALOR DA PRESTACAO', style: 'sectionTitle', colSpan: 2, margin: [3, 2, 3, 2] },
          {},
        ],
        [
          {
            stack: [
              { text: 'VALOR TOTAL DO SERVICO', style: 'label' },
              { text: formatCurrency(data.valorTotal), style: 'valueBold' },
            ],
            margin: [3, 2, 3, 2],
          },
          {
            stack: [
              { text: 'VALOR A RECEBER', style: 'label' },
              { text: formatCurrency(data.valorFrete), style: 'valueBold' },
            ],
            margin: [3, 2, 3, 2],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
    },
  };
}

function createInfoSection(data: CTeData): Content {
  const protocolo = data.metadata.protocolo || '';
  const dataAutorizacao = formatDateTime(data.metadata.dataAutorizacao as string);

  return {
    margin: [0, 5, 0, 0],
    table: {
      widths: ['*'],
      body: [
        [{ text: 'INFORMACOES RELATIVAS AO CT-e', style: 'sectionTitle', margin: [3, 2, 3, 2] }],
        [
          {
            stack: [
              {
                text: `Protocolo de Autorizacao: ${protocolo} - Data: ${dataAutorizacao}`,
                style: 'small',
              },
              { text: ' ', fontSize: 15 },
            ],
            margin: [3, 3, 3, 3],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
    },
  };
}
