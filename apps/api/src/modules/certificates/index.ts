// ============================================
// Certificates Module - Main Entry Point
// ============================================

export {
  CertificateValidationService,
  getCertificateValidationService,
  certificateValidation,
} from './service';

export type {
  CertificateStatus,
  CertificateValidationResult,
  ExpiringCertificate,
  AlertThreshold,
  AlertCreationResult,
  CertificateCheckerJobData,
} from './types';
