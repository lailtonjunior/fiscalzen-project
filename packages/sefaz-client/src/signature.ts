import { SignedXml } from 'xml-crypto';
import { createHash } from 'crypto';
import type { CertificadoA1 } from './types';
import { loadCertificadoCached } from './certificate';

/**
 * Calcula o digest SHA-1 de um conteúdo (para compatibilidade)
 */
export function calculateDigest(content: string): string {
  return createHash('sha1').update(content, 'utf8').digest('base64');
}

/**
 * Calcula o digest SHA-256 de um conteúdo
 */
export function calculateDigestSha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('base64');
}

/**
 * Gera o ID do evento no formato esperado pela SEFAZ
 * Formato: ID + tpEvento + chNFe + nSeqEvento (2 dígitos)
 * Exemplo: ID21021035240112345678000199550010000001231234567890001
 */
export function gerarEventoId(
  tipoEvento: string,
  chave: string,
  sequencia: number
): string {
  const seqFormatted = String(sequencia).padStart(2, '0');
  return `ID${tipoEvento}${chave}${seqFormatted}`;
}

/**
 * Assina um XML com certificado digital A1
 */
export function signXml(
  xml: string,
  certificado: CertificadoA1,
  options?: {
    referenceUri?: string;
  }
): string {
  const { privateKey, pem } = loadCertificadoCached(certificado);

  // Exporta a chave privada em formato PEM
  const privateKeyPem = privateKey.export({
    type: 'pkcs8',
    format: 'pem',
  }) as string;

  const sig = new SignedXml();

  sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
  sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';

  // Determina o XPath da referência
  const referenceXPath = options?.referenceUri
    ? `//*[@Id='${options.referenceUri.replace('#', '')}']`
    : "//*[local-name(.)='infEvento' or local-name(.)='infNFe' or local-name(.)='infCTe' or local-name(.)='infMDFe']";

  sig.addReference({
    xpath: referenceXPath,
    digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
    ]
  } as any);

  (sig as any).signingKey = privateKeyPem;

  (sig as any).keyInfoProvider = {
    getKeyInfo(): string {
      const cleanCert = pem
        .replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\r?\n/g, '')
        .trim();

      return `<X509Data><X509Certificate>${cleanCert}</X509Certificate></X509Data>`;
    }
  };

  sig.computeSignature(xml, { prefix: '' });

  return sig.getSignedXml();
}

/**
 * Assina XML usando chave privada e certificado em formato string
 * (mantido para compatibilidade com código legado)
 */
export function signXmlLegacy(
  xml: string,
  privateKey: string,
  certificate: string,
  referenceXPath: string = "//*[local-name(.)='NFe' or local-name(.)='nfeProc' or local-name(.)='MDFe' or local-name(.)='cteProc']"
): string {
  const sig = new SignedXml();

  sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
  sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';

  sig.addReference({
    xpath: referenceXPath,
    digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
    ]
  } as any);

  (sig as any).signingKey = privateKey;

  (sig as any).keyInfoProvider = {
    getKeyInfo(): string {
      const cleanCert = certificate
        .replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\r?\n/g, '')
        .trim();

      return `<X509Data><X509Certificate>${cleanCert}</X509Certificate></X509Data>`;
    }
  };

  sig.computeSignature(xml, { prefix: '' });

  return sig.getSignedXml();
}

/**
 * Valida a assinatura de um XML
 */
export function validateSignature(signedXml: string, publicCert: string): boolean {
  try {
    const sig = new SignedXml();

    (sig as any).keyInfoProvider = {
      getKey(): Buffer {
        return Buffer.from(publicCert);
      }
    };

    const signatureMatch = signedXml.match(/<Signature[^>]*>[\s\S]*?<\/Signature>/i);
    if (!signatureMatch) return false;

    sig.loadSignature(signatureMatch[0]);

    return sig.checkSignature(signedXml);
  } catch {
    return false;
  }
}