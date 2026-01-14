// ============================================
// Assinatura Digital XML (XMLDSig)
// ============================================
// Implementa assinatura XML conforme padrão da SEFAZ
// usando xml-crypto

import { SignedXml } from 'xml-crypto';
import { createHash } from 'crypto';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import type { CertificadoA1 } from './types.js';
import { loadCertificadoCached, getCertificadoPem } from './certificate.js';

// ============================================
// Tipos
// ============================================

export interface SignatureOptions {
  signatureId?: string;
  referenceUri: string; // ID do elemento a assinar (ex: "#NFe...")
}

export interface KeyInfoProvider {
  getKeyInfo(key?: string, prefix?: string): string;
  getKey(keyInfo?: string): Buffer;
}

// ============================================
// Assinatura XML
// ============================================

/**
 * Assina um XML conforme padrão SEFAZ (NFe, CTe, MDFe, Eventos)
 */
export function signXml(
  xml: string,
  certificado: CertificadoA1,
  options: SignatureOptions
): string {
  const { privateKey } = loadCertificadoCached(certificado);
  const certPem = getCertificadoPem(certificado);

  // Exporta a chave privada em formato PEM
  const privateKeyPem = privateKey.export({
    type: 'pkcs8',
    format: 'pem',
  }) as string;

  // Configura o assinador
  const sig = new SignedXml({
    privateKey: privateKeyPem,
    publicCert: certPem,
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
  });

  // Configura a referência (elemento a ser assinado)
  sig.addReference({
    xpath: `//*[@Id='${options.referenceUri.replace('#', '')}']`,
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    ],
  });

  // Configura o KeyInfo com o certificado X509
  sig.keyInfoProvider = createKeyInfoProvider(certPem);

  // Parse o XML
  const doc = new DOMParser().parseFromString(xml, 'text/xml');

  // Encontra o elemento a ser assinado
  const nodeToSign = findElementById(doc, options.referenceUri.replace('#', ''));
  if (!nodeToSign) {
    throw new Error(`Elemento com Id "${options.referenceUri}" não encontrado`);
  }

  // Computa a assinatura
  sig.computeSignature(xml, {
    location: {
      reference: `//*[@Id='${options.referenceUri.replace('#', '')}']`,
      action: 'append',
    },
  });

  return sig.getSignedXml();
}

/**
 * Cria provider de KeyInfo com certificado X509
 */
function createKeyInfoProvider(certPem: string): KeyInfoProvider {
  return {
    getKeyInfo(): string {
      return `<X509Data><X509Certificate>${certPem}</X509Certificate></X509Data>`;
    },
    getKey(): Buffer {
      return Buffer.from(certPem);
    },
  };
}

/**
 * Encontra elemento por Id no documento XML
 */
function findElementById(doc: Document, id: string): Element | null {
  // Tenta encontrar pelo atributo Id
  const elements = doc.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.getAttribute('Id') === id) {
      return element;
    }
  }
  return null;
}

// ============================================
// Assinatura de Evento (Manifestação)
// ============================================

/**
 * Assina um evento de manifestação do destinatário
 */
export function signEvento(
  xml: string,
  certificado: CertificadoA1,
  eventoId: string
): string {
  return signXml(xml, certificado, {
    referenceUri: `#${eventoId}`,
  });
}

/**
 * Gera o ID do evento de manifestação
 * Formato: ID + tpEvento + chNFe + nSeqEvento (2 dígitos)
 */
export function gerarEventoId(
  tipoEvento: string,
  chaveNFe: string,
  sequencia: number
): string {
  const seqStr = sequencia.toString().padStart(2, '0');
  return `ID${tipoEvento}${chaveNFe}${seqStr}`;
}

// ============================================
// Validação de Assinatura
// ============================================

/**
 * Valida a assinatura de um XML assinado
 */
export function validateSignature(signedXml: string): boolean {
  try {
    const doc = new DOMParser().parseFromString(signedXml, 'text/xml');

    // Encontra o elemento Signature
    const signatureElements = doc.getElementsByTagNameNS(
      'http://www.w3.org/2000/09/xmldsig#',
      'Signature'
    );

    if (signatureElements.length === 0) {
      return false;
    }

    const sig = new SignedXml();

    // Extrai o certificado do KeyInfo para validação
    const x509Cert = doc.getElementsByTagName('X509Certificate')[0];
    if (x509Cert && x509Cert.textContent) {
      sig.publicCert = `-----BEGIN CERTIFICATE-----\n${x509Cert.textContent}\n-----END CERTIFICATE-----`;
    }

    sig.loadSignature(new XMLSerializer().serializeToString(signatureElements[0]));

    return sig.checkSignature(signedXml);
  } catch {
    return false;
  }
}

// ============================================
// Cálculo de Digest
// ============================================

/**
 * Calcula o digest SHA-1 de um conteúdo
 */
export function calculateDigest(content: string): string {
  return createHash('sha1').update(content).digest('base64');
}

/**
 * Canonicaliza XML (C14N)
 */
export function canonicalizeXml(xml: string): string {
  // Implementação simplificada de C14N
  // Em produção, usar bibliotecas especializadas
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  return new XMLSerializer().serializeToString(doc);
}

// ============================================
// Builders de XML para Assinatura
// ============================================

/**
 * Constrói o elemento SignedInfo para assinatura
 */
export function buildSignedInfo(
  referenceUri: string,
  digestValue: string
): string {
  return `
<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
  <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
  <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
  <Reference URI="${referenceUri}">
    <Transforms>
      <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
      <Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    </Transforms>
    <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
    <DigestValue>${digestValue}</DigestValue>
  </Reference>
</SignedInfo>`.trim();
}

/**
 * Constrói o elemento Signature completo
 */
export function buildSignature(
  signedInfo: string,
  signatureValue: string,
  x509Certificate: string
): string {
  return `
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
  ${signedInfo}
  <SignatureValue>${signatureValue}</SignatureValue>
  <KeyInfo>
    <X509Data>
      <X509Certificate>${x509Certificate}</X509Certificate>
    </X509Data>
  </KeyInfo>
</Signature>`.trim();
}
