// packages/sefaz-client/src/signature.ts
import { SignedXml } from 'xml-crypto';
import { createHash } from 'crypto';

export function calculateDigest(xml: string): string {
  return createHash('sha256').update(xml, 'utf8').digest('base64');
}

export function signXml(
  xml: string,
  privateKey: string,
  certificate: string,
  referenceXPath: string = "//*[local-name(.)='NFe' or local-name(.)='nfeProc' or local-name(.)='MDFe' or local-name(.)='cteProc']"
): string {
  const sig = new SignedXml();

  sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
  sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';

  // Forma MODERNA (objeto) - aceita em runtime pela v6+
  // Usamos 'as const' + cast para driblar tipos antigos/desatualizados
  sig.addReference({
    xpath: referenceXPath,
    digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
    ]
  } as any);  // ← cast temporário - remove quando tipos forem corrigidos

  sig.signingKey = privateKey;

  sig.keyInfoProvider = {
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

export function validateSignature(signedXml: string, publicCert: string): boolean {
  try {
    const sig = new SignedXml();

    sig.keyInfoProvider = {
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