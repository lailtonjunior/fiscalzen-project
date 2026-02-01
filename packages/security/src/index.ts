// ============================================
// @fiscalzen/security - Main Entry Point
// ============================================

// Envelope Encryption
export {
  EnvelopeEncryption,
  envelopeEncryption,
  deriveKekFromPassword,
  generateKek,
  secureCompare,
  type EncryptedEnvelope,
  type SerializedEnvelope,
} from './envelope-encryption';

// KMS Providers
export {
  AWSKMSProvider,
  LocalKMSProvider,
  createKMSProvider,
  getKMSProvider,
  resetKMSProvider,
  type KMSProvider,
  type KMSConfig,
  type DataKeyResult,
} from './kms';

// Audit
export {
  InMemoryAuditLogger,
  createDatabaseAuditLogger,
  withAudit,
  ConsoleSecurityLogger,
  type AuditLogger,
  type AuditContext,
  type AuditEntry,
  type AuditQueryFilters,
  type CertificateAction,
  type AuditStatus,
  type SecurityEventLogger,
  type SecurityEventEntry,
  type SecurityEventType,
  type SecuritySeverity,
} from './audit';

// Secure Certificate Service
export {
  SecureCertificateService,
  getSecureCertificateService,
  resetSecureCertificateService,
  type SecureCertificateData,
  type SecureCertificateConfig,
  type CertificateMetadata,
} from './secure-certificate';
