// ============================================
// Certificado Digital A1 (.pfx/.p12)
// ============================================
// Leitura e extração de informações do certificado
// para uso em requisições SEFAZ

import { createPrivateKey, createPublicKey, X509Certificate } from 'crypto';
import type { KeyObject } from 'crypto';
import type { CertificadoA1 } from './types.js';
import { CertificadoError } from './types.js';

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

export interface CertificadoKeys {
  privateKey: KeyObject;
  publicKey: KeyObject;
  certificate: X509Certificate;
  pem: string;
}

/**
 * Carrega e valida um certificado A1 (.pfx/.p12)
 */
export function loadCertificado(certificado: CertificadoA1): CertificadoKeys {
  try {
    const { pfxBuffer, password } = certificado;

    // Importa a chave privada do PFX
    const privateKey = createPrivateKey({
      key: pfxBuffer,
      format: 'der',
      type: 'pkcs12',
      passphrase: password,
    });

    // Extrai a chave pública da privada
    const publicKey = createPublicKey(privateKey);

    // Para extrair o certificado X.509, precisamos converter o PFX
    // O Node.js crypto não tem suporte direto, então usamos uma abordagem alternativa
    const pemKey = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

    // Tenta extrair o certificado X.509 do PFX
    // Nota: Esta é uma implementação simplificada
    // Em produção, considere usar node-forge ou pkcs12 parsing
    const certificate = extractX509FromPfx(pfxBuffer, password);

    return {
      privateKey,
      publicKey,
      certificate,
      pem: certificate.toString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new CertificadoError(`Falha ao carregar certificado: ${message}`);
  }
}

/**
 * Extrai o certificado X.509 do arquivo PFX
 * Usa a API nativa do Node.js
 */
function extractX509FromPfx(pfxBuffer: Buffer, password: string): X509Certificate {
  try {
    // O Node.js 16+ suporta X509Certificate diretamente do PFX
    // através de um workaround usando tls.createSecureContext
    const tls = require('tls');

    const context = tls.createSecureContext({
      pfx: pfxBuffer,
      passphrase: password,
    });

    // Extrai o certificado do contexto
    const cert = context.context.getCertificate();
    if (!cert) {
      throw new Error('Certificado não encontrado no arquivo PFX');
    }

    return new X509Certificate(cert);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new CertificadoError(`Falha ao extrair certificado X.509: ${message}`);
  }
}

/**
 * Extrai informações do certificado (CNPJ, Razão Social, validade)
 */
export function getCertificadoInfo(certificado: CertificadoA1): CertificadoInfo {
  const { certificate } = loadCertificado(certificado);

  const subject = certificate.subject;
  const issuer = certificate.issuer;
  const validFrom = new Date(certificate.validFrom);
  const validTo = new Date(certificate.validTo);
  const serialNumber = certificate.serialNumber;

  // Extrai CNPJ do subject (formato: CN=EMPRESA:12345678000199)
  const cnpj = extractCnpjFromSubject(subject);
  const razaoSocial = extractRazaoSocialFromSubject(subject);

  // Calcula thumbprint (SHA-1 fingerprint)
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
 * Extrai CNPJ do subject do certificado
 * Formatos comuns:
 * - CN=EMPRESA LTDA:12345678000199
 * - serialNumber=12345678000199
 * - 2.5.4.5=12345678000199 (OID do serialNumber)
 */
function extractCnpjFromSubject(subject: string): string {
  // Tenta extrair do formato CN=NOME:CNPJ
  const cnMatch = subject.match(/CN=([^,]*):(\d{14})/);
  if (cnMatch) {
    return cnMatch[2];
  }

  // Tenta extrair do serialNumber
  const snMatch = subject.match(/serialNumber=(\d{14})/i);
  if (snMatch) {
    return snMatch[1];
  }

  // Tenta extrair de qualquer sequência de 14 dígitos
  const genericMatch = subject.match(/(\d{14})/);
  if (genericMatch) {
    return genericMatch[1];
  }

  throw new CertificadoError('CNPJ não encontrado no certificado');
}

/**
 * Extrai Razão Social do subject do certificado
 */
function extractRazaoSocialFromSubject(subject: string): string {
  // Tenta extrair do formato CN=NOME:CNPJ
  const cnMatch = subject.match(/CN=([^:,]+)/);
  if (cnMatch) {
    return cnMatch[1].trim();
  }

  // Tenta extrair do O (Organization)
  const orgMatch = subject.match(/O=([^,]+)/);
  if (orgMatch) {
    return orgMatch[1].trim();
  }

  return 'Não identificado';
}

/**
 * Valida se o certificado está dentro da validade
 */
export function validateCertificado(certificado: CertificadoA1): {
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
    (info.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
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
 * Exporta o certificado em formato PEM (Base64)
 * Usado para inclusão no XML assinado
 */
export function getCertificadoPem(certificado: CertificadoA1): string {
  const { pem } = loadCertificado(certificado);

  // Remove headers e footers do PEM
  const cleanPem = pem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s/g, '');

  return cleanPem;
}

/**
 * Retorna a chave privada para assinatura XML
 */
export function getPrivateKey(certificado: CertificadoA1): KeyObject {
  const { privateKey } = loadCertificado(certificado);
  return privateKey;
}

/**
 * Cache de certificados carregados para evitar reload
 */
const certificadoCache = new Map<string, CertificadoKeys>();

/**
 * Carrega certificado com cache
 */
export function loadCertificadoCached(certificado: CertificadoA1): CertificadoKeys {
  // Cria chave de cache baseada no hash do buffer
  const cacheKey = require('crypto')
    .createHash('sha256')
    .update(certificado.pfxBuffer)
    .digest('hex');

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
