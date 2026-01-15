// ======================================================
// Certificado Digital A1 (.pfx / .p12)
// Leitura, parsing, validação e extração de informações
// Compatível com SEFAZ, XML Signature e DTS (tsup)
// ======================================================

import forge from 'node-forge';
import {
  createPrivateKey,
  createPublicKey,
  X509Certificate,
  createHash,
} from 'crypto';

import type { KeyObject } from 'crypto';
import type { CertificadoA1 } from './types';
import { CertificadoError } from './types';

/**
 * Informações extraídas do certificado
 */
export interface CertificadoInfo {
  cnpj: string;
  razaoSocial: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  issuer: string;
  subject: string;
  thumbprint: string;
}

/**
 * Estrutura completa do certificado carregado
 */
export interface CertificadoKeys {
  privateKey: KeyObject;
  publicKey: KeyObject;
  certificate: X509Certificate;
  pem: string; // certificado em base64 (sem headers)
}

/**
 * Cache interno para evitar múltiplos parses do mesmo PFX
 */
const certificadoCache = new Map<string, CertificadoKeys>();

/**
 * Gera hash SHA-256 do buffer do certificado
 * usado como chave de cache
 */
function generateCacheKey(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Carrega e processa um certificado A1 (.pfx/.p12)
 * Parsing feito via node-forge (forma correta)
 */
export function loadCertificado(certificado: CertificadoA1): CertificadoKeys {
  try {
    const { pfxBuffer, password } = certificado;

    // Converte PFX para ASN.1
    const pfxAsn1 = forge.asn1.fromDer(
      pfxBuffer.toString('binary')
    );

    // Abre o PKCS#12
    const pkcs12 = forge.pkcs12.pkcs12FromAsn1(
      pfxAsn1,
      false,
      password
    );

    // ===============================
    // Extração da chave privada
    // ===============================
    const keyBags = pkcs12.getBags({
      bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    })[forge.pki.oids.pkcs8ShroudedKeyBag];

    if (!keyBags || keyBags.length === 0) {
      throw new Error('Chave privada não encontrada no certificado');
    }

    const privateKeyPem = forge.pki.privateKeyToPem(
      keyBags[0].key
    );

    const privateKey = createPrivateKey(privateKeyPem);
    const publicKey = createPublicKey(privateKey);

    // ===============================
    // Extração do certificado X509
    // ===============================
    const certBags = pkcs12.getBags({
      bagType: forge.pki.oids.certBag,
    })[forge.pki.oids.certBag];

    if (!certBags || certBags.length === 0) {
      throw new Error('Certificado X509 não encontrado no PFX');
    }

    const certPem = forge.pki.certificateToPem(
      certBags[0].cert
    );

    const certificate = new X509Certificate(certPem);

    // Remove headers e quebras de linha (uso em XML)
    const cleanPem = certPem
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s+/g, '');

    return {
      privateKey,
      publicKey,
      certificate,
      pem: cleanPem,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido';
    throw new CertificadoError(
      `Falha ao carregar certificado: ${message}`
    );
  }
}

/**
 * Carrega certificado usando cache
 */
export function loadCertificadoCached(
  certificado: CertificadoA1
): CertificadoKeys {
  const cacheKey = generateCacheKey(certificado.pfxBuffer);

  const cached = certificadoCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const loaded = loadCertificado(certificado);
  certificadoCache.set(cacheKey, loaded);

  return loaded;
}

/**
 * Limpa o cache de certificados
 */
export function clearCertificadoCache(): void {
  certificadoCache.clear();
}

/**
 * Extrai informações do certificado
 */
export function getCertificadoInfo(
  certificado: CertificadoA1
): CertificadoInfo {
  const { certificate } = loadCertificadoCached(certificado);

  const subject = certificate.subject;
  const issuer = certificate.issuer;

  const validFrom = new Date(certificate.validFrom);
  const validTo = new Date(certificate.validTo);

  const serialNumber = certificate.serialNumber;

  const cnpj = extractCnpjFromSubject(subject);
  const razaoSocial = extractRazaoSocialFromSubject(subject);

  const thumbprint = certificate.fingerprint.replace(/:/g, '');

  return {
    cnpj,
    razaoSocial,
    validFrom,
    validTo,
    serialNumber,
    issuer,
    subject,
    thumbprint,
  };
}

/**
 * Valida se o certificado está válido
 */
export function validateCertificado(
  certificado: CertificadoA1
): {
  valid: boolean;
  daysUntilExpiry: number;
  message: string;
} {
  const info = getCertificadoInfo(certificado);
  const now = new Date();

  if (now < info.validFrom) {
    return {
      valid: false,
      daysUntilExpiry: 0,
      message: `Certificado ainda não é válido. Válido a partir de ${info.validFrom.toISOString()}`,
    };
  }

  if (now > info.validTo) {
    return {
      valid: false,
      daysUntilExpiry: 0,
      message: `Certificado expirado em ${info.validTo.toISOString()}`,
    };
  }

  const daysUntilExpiry = Math.floor(
    (info.validTo.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const message =
    daysUntilExpiry <= 30
      ? `Certificado expira em ${daysUntilExpiry} dias`
      : `Certificado válido até ${info.validTo.toISOString()}`;

  return {
    valid: true,
    daysUntilExpiry,
    message,
  };
}

/**
 * Retorna o certificado em Base64 (sem headers)
 * para uso em XML assinado
 */
export function getCertificadoPem(
  certificado: CertificadoA1
): string {
  const { pem } = loadCertificadoCached(certificado);
  return pem;
}

/**
 * Retorna a chave privada para assinatura XML
 */
export function getPrivateKey(
  certificado: CertificadoA1
): KeyObject {
  const { privateKey } = loadCertificadoCached(certificado);
  return privateKey;
}

/**
 * ================================
 * Funções auxiliares de parsing
 * ================================
 */

/**
 * Extrai CNPJ do subject do certificado
 */
function extractCnpjFromSubject(subject: string): string {
  const cnMatch = subject.match(/CN=([^,]*):(\d{14})/);
  if (cnMatch) {
    return cnMatch[2];
  }

  const serialMatch = subject.match(/serialNumber=(\d{14})/i);
  if (serialMatch) {
    return serialMatch[1];
  }

  const genericMatch = subject.match(/(\d{14})/);
  if (genericMatch) {
    return genericMatch[1];
  }

  throw new CertificadoError(
    'CNPJ não encontrado no certificado'
  );
}

/**
 * Extrai Razão Social do subject
 */
function extractRazaoSocialFromSubject(subject: string): string {
  const cnMatch = subject.match(/CN=([^:,]+)/);
  if (cnMatch) {
    return cnMatch[1].trim();
  }

  const orgMatch = subject.match(/O=([^,]+)/);
  if (orgMatch) {
    return orgMatch[1].trim();
  }

  return 'Não identificado';
}
