import bwipjs from 'bwip-js';
import QRCode from 'qrcode';

/**
 * Gera código de barras Code128 para a chave de acesso
 * @param chave Chave de acesso do documento (44 dígitos)
 * @returns Base64 data URL da imagem PNG
 */
export async function generateCode128(chave: string): Promise<string> {
  const png = await bwipjs.toBuffer({
    bcid: 'code128',
    text: chave,
    scale: 2,
    height: 12,
    includetext: false,
  });
  return `data:image/png;base64,${png.toString('base64')}`;
}

/**
 * Gera QR Code para URL de consulta do documento
 * @param url URL de consulta do documento fiscal
 * @returns Base64 data URL da imagem PNG
 */
export async function generateQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 100,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
}

/**
 * Gera URL de consulta da NFe na SEFAZ
 */
export function getNFeConsultaUrl(chave: string): string {
  return `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&tipoConteudo=XbSeqxE8pl8=&nfe=${chave}`;
}

/**
 * Gera URL de consulta do CTe na SEFAZ
 */
export function getCTeConsultaUrl(chave: string): string {
  return `https://dfe-portal.svrs.rs.gov.br/cte/qrCode?chCTe=${chave}&tpAmb=1`;
}
