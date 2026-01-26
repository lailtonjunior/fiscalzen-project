import type { TDocumentDefinitions, Content, TableCell, ContentTable } from 'pdfmake/interfaces';
import type { NFeData, NFeItem } from '@fiscalzen/xml-parser';
import {
  formatCnpjCpf,
  formatChaveAcesso,
  formatCurrency,
  formatQuantidade,
  formatNumero,
  formatSerie,
  formatDate,
  formatDateTime,
  getModalidadeFrete,
} from '../utils/formatters';

// ============================================
// DANFE - Documento Auxiliar da NFe
// Layout seguindo especificacoes oficiais
// ============================================

export interface DanfeLayoutOptions {
  barcodeBase64: string;
  qrCodeBase64?: string;
}

export async function getNFeLayout(
  data: NFeData,
  options: DanfeLayoutOptions
): Promise<TDocumentDefinitions> {
  const { barcodeBase64 } = options;

  return {
    pageSize: 'A4',
    pageMargins: [15, 15, 15, 15],
    defaultStyle: {
      fontSize: 7,
    },
    styles: {
      danfeTitle: { fontSize: 12, bold: true },
      sectionTitle: { fontSize: 6, bold: true, fillColor: '#E8E8E8' },
      label: { fontSize: 5, color: '#444444' },
      value: { fontSize: 7 },
      valueBold: { fontSize: 7, bold: true },
      small: { fontSize: 5 },
      chave: { fontSize: 6, characterSpacing: 0.5 },
      numero: { fontSize: 10, bold: true },
      tableHeader: { fontSize: 5, bold: true, fillColor: '#E8E8E8' },
    },
    content: [
      // ========================================
      // CABECALHO PRINCIPAL
      // ========================================
      createHeader(data, barcodeBase64),

      // ========================================
      // DESTINATARIO / REMETENTE
      // ========================================
      createDestinatarioSection(data),

      // ========================================
      // CALCULO DO IMPOSTO
      // ========================================
      createImpostosSection(data),

      // ========================================
      // TRANSPORTADOR / VOLUMES
      // ========================================
      createTransporteSection(data),

      // ========================================
      // DADOS DOS PRODUTOS / SERVICOS
      // ========================================
      createProdutosSection(data.itens),

      // ========================================
      // DADOS ADICIONAIS
      // ========================================
      createDadosAdicionaisSection(data),
    ],
  };
}

function createHeader(data: NFeData, barcodeBase64: string): Content {
  const tipoNF = data.metadata.tpNF === '0' ? '0 - ENTRADA' : '1 - SAIDA';

  return {
    table: {
      widths: ['35%', '20%', '45%'],
      heights: [70],
      body: [
        [
          // Coluna 1: Dados do Emitente
          {
            stack: [
              { text: data.emitente.razaoSocial, fontSize: 9, bold: true, margin: [0, 0, 0, 3] },
              { text: `CNPJ: ${formatCnpjCpf(data.emitente.cnpj)}`, style: 'small' },
              { text: `UF: ${data.emitente.uf || ''}`, style: 'small' },
            ],
            margin: [3, 3, 3, 3],
          },
          // Coluna 2: DANFE
          {
            stack: [
              { text: 'DANFE', style: 'danfeTitle', alignment: 'center' },
              { text: 'Documento Auxiliar da', style: 'small', alignment: 'center' },
              { text: 'Nota Fiscal Eletronica', style: 'small', alignment: 'center' },
              { text: ' ', fontSize: 4 },
              { text: tipoNF, fontSize: 8, bold: true, alignment: 'center' },
              { text: ' ', fontSize: 4 },
              { text: `No ${formatNumero(data.numero)}`, style: 'numero', alignment: 'center' },
              { text: `Serie ${formatSerie(data.serie)}`, style: 'small', alignment: 'center' },
            ],
            margin: [3, 3, 3, 3],
          },
          // Coluna 3: Codigo de Barras + Chave
          {
            stack: [
              { image: barcodeBase64, width: 230, height: 35, alignment: 'center' },
              { text: ' ', fontSize: 2 },
              { text: 'CHAVE DE ACESSO', style: 'label', alignment: 'center' },
              { text: formatChaveAcesso(data.chave), style: 'chave', alignment: 'center' },
              { text: ' ', fontSize: 2 },
              {
                text: `Protocolo: ${data.metadata.protocolo || ''} - ${formatDateTime(data.metadata.dataAutorizacao as string)}`,
                style: 'small',
                alignment: 'center',
              },
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

function createDestinatarioSection(data: NFeData): Content {
  return {
    margin: [0, 5, 0, 0],
    table: {
      widths: ['*', 120, 80],
      body: [
        [
          { text: 'DESTINATARIO / REMETENTE', style: 'sectionTitle', colSpan: 3, margin: [3, 2, 3, 2] },
          {},
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

function createImpostosSection(data: NFeData): Content {
  return {
    margin: [0, 5, 0, 0],
    table: {
      widths: ['*', '*', '*', '*', '*'],
      body: [
        [
          { text: 'CALCULO DO IMPOSTO', style: 'sectionTitle', colSpan: 5, margin: [3, 2, 3, 2] },
          {},
          {},
          {},
          {},
        ],
        [
          {
            stack: [
              { text: 'BASE DE CALC. ICMS', style: 'label' },
              { text: formatCurrency(0), style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
          {
            stack: [
              { text: 'VALOR DO ICMS', style: 'label' },
              { text: formatCurrency(0), style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
          {
            stack: [
              { text: 'VALOR DO FRETE', style: 'label' },
              { text: formatCurrency(0), style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
          {
            stack: [
              { text: 'VALOR DO SEGURO', style: 'label' },
              { text: formatCurrency(0), style: 'value' },
            ],
            margin: [3, 2, 3, 2],
          },
          {
            stack: [
              { text: 'VALOR TOTAL DA NOTA', style: 'label' },
              { text: formatCurrency(data.valorTotal), style: 'valueBold' },
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

function createTransporteSection(data: NFeData): Content {
  const modFrete = getModalidadeFrete(data.metadata.modFrete as string);

  return {
    margin: [0, 5, 0, 0],
    table: {
      widths: ['*'],
      body: [
        [{ text: 'TRANSPORTADOR / VOLUMES TRANSPORTADOS', style: 'sectionTitle', margin: [3, 2, 3, 2] }],
        [
          {
            stack: [
              { text: 'MODALIDADE DO FRETE', style: 'label' },
              { text: modFrete, style: 'value' },
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

function createProdutosSection(itens: NFeItem[]): Content {
  const tableBody: TableCell[][] = [
    // Header
    [
      { text: 'DADOS DOS PRODUTOS / SERVICOS', style: 'sectionTitle', colSpan: 7, margin: [3, 2, 3, 2] },
      {},
      {},
      {},
      {},
      {},
      {},
    ],
    [
      { text: 'CODIGO', style: 'tableHeader', alignment: 'center', margin: [2, 2, 2, 2] },
      { text: 'DESCRICAO DO PRODUTO / SERVICO', style: 'tableHeader', alignment: 'center', margin: [2, 2, 2, 2] },
      { text: 'NCM/SH', style: 'tableHeader', alignment: 'center', margin: [2, 2, 2, 2] },
      { text: 'CFOP', style: 'tableHeader', alignment: 'center', margin: [2, 2, 2, 2] },
      { text: 'QTD', style: 'tableHeader', alignment: 'center', margin: [2, 2, 2, 2] },
      { text: 'VL. UNIT', style: 'tableHeader', alignment: 'center', margin: [2, 2, 2, 2] },
      { text: 'VL. TOTAL', style: 'tableHeader', alignment: 'center', margin: [2, 2, 2, 2] },
    ],
  ];

  // Itens
  for (const item of itens) {
    tableBody.push([
      { text: item.codigo || '', fontSize: 6, margin: [2, 1, 2, 1] },
      { text: item.descricao || '', fontSize: 6, margin: [2, 1, 2, 1] },
      { text: item.ncm || '', fontSize: 6, alignment: 'center', margin: [2, 1, 2, 1] },
      { text: item.cfop || '', fontSize: 6, alignment: 'center', margin: [2, 1, 2, 1] },
      { text: formatQuantidade(item.quantidade), fontSize: 6, alignment: 'right', margin: [2, 1, 2, 1] },
      { text: formatCurrency(item.valorUnitario), fontSize: 6, alignment: 'right', margin: [2, 1, 2, 1] },
      { text: formatCurrency(item.valorTotal), fontSize: 6, alignment: 'right', margin: [2, 1, 2, 1] },
    ]);
  }

  return {
    margin: [0, 5, 0, 0],
    table: {
      headerRows: 2,
      widths: [50, '*', 45, 35, 45, 55, 55],
      body: tableBody,
    },
    layout: {
      hLineWidth: (i: number, node: ContentTable) => (i <= 2 || i === node.table.body.length ? 0.5 : 0.3),
      vLineWidth: () => 0.5,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
    },
  };
}

function createDadosAdicionaisSection(data: NFeData): Content {
  const natOp = data.metadata.natOp || '';

  return {
    margin: [0, 5, 0, 0],
    table: {
      widths: ['*'],
      body: [
        [{ text: 'DADOS ADICIONAIS', style: 'sectionTitle', margin: [3, 2, 3, 2] }],
        [
          {
            stack: [
              { text: 'INFORMACOES COMPLEMENTARES', style: 'label' },
              { text: `Natureza da Operacao: ${natOp}`, style: 'small' },
              { text: ' ', fontSize: 20 }, // Spacer for minimum height
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
