import { gunzipSync, gzipSync } from 'zlib';
import type { DecodeResult } from './types.js';

/**
 * Decodifica um documento retornado pela SEFAZ via DistDFe
 *
 * O retorno da SEFAZ vem no formato:
 * <docZip NSU="000000000012345" schema="procNFe_v4.00.xsd">
 *   H4sIAAAAAAAAA6tWKkktLlGyUl... (Base64 + GZip)
 * </docZip>
 *
 * Esta função:
 * 1. Decodifica o Base64
 * 2. Descompacta o GZip
 * 3. Retorna o XML como string UTF-8
 *
 * @param base64GzipContent - Conteúdo em Base64 + GZip
 * @returns XML descompactado como string
 */
export function decodeDocZip(base64GzipContent: string): string {
  try {
    // Remover espaços e quebras de linha
    const cleanBase64 = base64GzipContent.replace(/\s/g, '');

    // Decodificar Base64 para Buffer
    const gzipBuffer = Buffer.from(cleanBase64, 'base64');

    // Descompactar GZip
    const xmlBuffer = gunzipSync(gzipBuffer);

    // Converter para string UTF-8
    return xmlBuffer.toString('utf-8');
  } catch (error) {
    throw new Error(`Falha ao decodificar docZip: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Processa um lote de documentos do retorno da DistDFe
 *
 * @param loteDistDFeInt - Array de objetos docZip do retorno da SEFAZ
 * @returns Array de resultados decodificados
 */
export function processLoteDistDFe(
  loteDistDFeInt: Array<{
    '@_NSU': string;
    '@_schema': string;
    '#text': string;
  }>
): DecodeResult[] {
  const results: DecodeResult[] = [];

  for (const docZip of loteDistDFeInt) {
    try {
      const xml = decodeDocZip(docZip['#text']);
      results.push({
        nsu: docZip['@_NSU'],
        schema: docZip['@_schema'],
        xml,
      });
    } catch (error) {
      // Log error but continue processing other documents
      console.error(`Erro ao processar NSU ${docZip['@_NSU']}:`, error);
    }
  }

  return results;
}

/**
 * Compacta um XML para o formato Base64 + GZip
 * (útil para testes e simulações)
 *
 * @param xml - XML a ser compactado
 * @returns String em Base64 + GZip
 */
export function encodeToDocZip(xml: string): string {
  const xmlBuffer = Buffer.from(xml, 'utf-8');
  const gzipBuffer = gzipSync(xmlBuffer);
  return gzipBuffer.toString('base64');
}

/**
 * Verifica se uma string parece ser conteúdo Base64 + GZip
 */
export function isBase64Gzip(content: string): boolean {
  // GZip magic number em Base64 começa com "H4sI"
  const cleanContent = content.trim();
  return cleanContent.startsWith('H4sI') || cleanContent.startsWith('H4s');
}

/**
 * Tenta decodificar conteúdo, retornando o original se não for GZip
 */
export function tryDecode(content: string): string {
  const trimmed = content.trim();

  // Se já é XML, retornar como está
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
    return trimmed;
  }

  // Tentar decodificar como Base64 + GZip
  if (isBase64Gzip(trimmed)) {
    try {
      return decodeDocZip(trimmed);
    } catch {
      // Se falhar, retornar original
      return trimmed;
    }
  }

  return trimmed;
}

/**
 * Extrai o NSU de um elemento docZip
 */
export function extractNsuFromDocZip(docZipElement: Record<string, unknown>): string {
  const nsu = docZipElement['@_NSU'];
  if (typeof nsu === 'string') {
    return nsu.padStart(15, '0');
  }
  return '000000000000000';
}

/**
 * Extrai o schema de um elemento docZip
 */
export function extractSchemaFromDocZip(docZipElement: Record<string, unknown>): string {
  const schema = docZipElement['@_schema'];
  return typeof schema === 'string' ? schema : '';
}

/**
 * Determina o tipo de documento pelo nome do schema
 */
export function getDocTypeFromSchema(schema: string): string {
  const schemaLower = schema.toLowerCase();

  if (schemaLower.includes('procnfe')) return 'procNFe';
  if (schemaLower.includes('resnfe')) return 'resNFe';
  if (schemaLower.includes('proceventonfe')) return 'procEventoNFe';
  if (schemaLower.includes('resevento')) return 'resEvento';
  if (schemaLower.includes('proccte')) return 'procCTe';
  if (schemaLower.includes('rescte')) return 'resCTe';
  if (schemaLower.includes('procmdfe')) return 'procMDFe';

  return 'unknown';
}
