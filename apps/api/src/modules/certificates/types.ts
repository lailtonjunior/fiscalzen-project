// ============================================
// Certificate Validation Types
// ============================================

/**
 * Status de validacao do certificado
 */
export type CertificateStatus = 'valid' | 'expiring' | 'expired' | 'missing' | 'invalid';

/**
 * Resultado da validacao de um certificado
 */
export interface CertificateValidationResult {
  companyId: string;
  companyName: string;
  cnpj: string;
  status: CertificateStatus;
  daysUntilExpiry: number | null;
  expiryDate: Date | null;
  message: string;
}

/**
 * Certificado proximo da expiracao
 */
export interface ExpiringCertificate {
  tenantId: string;
  companyId: string;
  companyName: string;
  cnpj: string;
  daysUntilExpiry: number;
  expiryDate: Date;
}

/**
 * Thresholds para alertas de expiracao (em dias)
 */
export type AlertThreshold = 30 | 15 | 7 | 1;

/**
 * Resultado da criacao de alertas
 */
export interface AlertCreationResult {
  created: number;
  skipped: number;
}

/**
 * Dados do job de verificacao de certificados
 */
export interface CertificateCheckerJobData {
  scheduledRun: boolean;
}
