// ============================================
// API Response Types
// ============================================

export type DocType = 'NFE' | 'CTE' | 'MDFE';
export type Situacao = 'autorizada' | 'cancelada' | 'denegada' | 'pendente';
export type ManifestacaoTipo = '210200' | '210210' | '210220' | '210240';

// ============================================
// Document Types
// ============================================

export interface Document {
  id: string;
  tenantId: string;
  companyId: string;
  chave: string;
  numero: string;
  serie: string;
  docType: DocType;
  situacao: Situacao;
  dataEmissao: string;
  valorTotal: string;
  emitCnpj: string;
  emitRazaoSocial: string;
  emitIe?: string;
  destCnpj?: string;
  destRazaoSocial?: string;
  natOp?: string;
  uf: string;
  nsu?: string;
  hasXml?: boolean;
  hasPdf?: boolean;
  manifestacao?: ManifestacaoTipo;
  manifestacaoData?: string;
  createdAt: string;
  updatedAt: string;
  emitRazao?: string;
  destRazao?: string;
  destCnpjCpf?: string;
}

export interface DocumentEvent {
  id: string;
  documentId: string;
  tpEvento: string;
  descEvento: string;
  nSeqEvento: number;
  dhEvento: string;
  dhRegEvento: string;
  nProt?: string;
  cStat: string;
  xMotivo: string;
  xmlEvento?: string;
  createdAt: string;
}

export interface DocumentWithEvents extends Document {
  events: DocumentEvent[];
  xmlOriginal?: string;
  hasXml?: boolean;
  hasPdf?: boolean;
}

export interface DocumentAttachment {
  type: 'xml' | 'pdf';
  label: string;
  available: boolean;
  filename: string;
  downloadPath: string;
  representation?: 'DANFE' | 'DACTE' | 'DACTE_OS';
  statusMessage?: string;
}

// ============================================
// Company Types
// ============================================

export interface Company {
  id: string;
  tenantId: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  ie?: string;
  im?: string;
  uf: string;
  hasCertificate: boolean;
  certificateExpiry?: string;
  monitorNfe: boolean;
  monitorCte: boolean;
  monitorMdfe: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyWithStats extends Company {
  documentsCount: number;
  lastSync?: string;
}

export interface NsuControl {
  companyId: string;
  docType: DocType;
  lastNsu: string;
  maxNsu?: string;
  lastSync?: string;
  nextSync?: string;
  syncStatus: 'idle' | 'syncing' | 'error' | 'rate_limited';
  errorCount: number;
  lastError?: string;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardSummary {
  totalDocuments: number;
  totalByType: {
    NFE: number;
    CTE: number;
    MDFE: number;
  };
  totalByStatus: {
    autorizada: number;
    cancelada: number;
    denegada: number;
    pendente: number;
  };
  totalValue: number;
  pendingManifestation: number;
  recentDocuments: Document[];
}

export interface IntegrityStatus {
  status: 'green' | 'yellow' | 'red';
  message: string;
  gaps: IntegrityGap[];
  lastCheck: string;
}

export interface IntegrityGap {
  companyId: string;
  companyName: string;
  docType: DocType;
  startNsu: string;
  endNsu: string;
  missingCount: number;
}

export interface TimelineData {
  date: string;
  NFE: number;
  CTE: number;
  MDFE: number;
  total: number;
}

// ============================================
// Jobs Types
// ============================================

export interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

export interface WorkerStatus {
  name: string;
  isRunning: boolean;
  isPaused: boolean;
  concurrency: number;
}

export interface JobsStatus {
  queues: QueueStatus[];
  workers: WorkerStatus[];
}

export interface CompanySyncStatus {
  companyId: string;
  companyName: string;
  nsuControls: NsuControl[];
}

// ============================================
// Download Types
// ============================================

export type DownloadFormat = 'xml' | 'pdf' | 'both';
export type DownloadOrganization = 'flat' | 'by-date' | 'by-type' | 'by-company';
export type DownloadJobStatus = 'queued' | 'active' | 'completed' | 'failed';

export interface BatchDownloadRequest {
  documentIds?: string[];
  filters?: Record<string, unknown>;
  format: DownloadFormat;
  includeMetadata: boolean;
  organizacao: DownloadOrganization;
}

export interface BatchDownloadCreated {
  jobId: string;
  status: DownloadJobStatus;
  estimatedDocuments: number;
  estimatedTimeSeconds: number;
}

export interface BatchDownloadJob {
  jobId: string;
  status: DownloadJobStatus;
  progress: number;
  estimatedDocuments?: number | null;
  format?: DownloadFormat;
  includeMetadata?: boolean;
  organizacao?: DownloadOrganization;
  createdAt: string;
  processedAt?: string | null;
  finishedAt?: string | null;
  result?: {
    success?: boolean;
    processed?: number;
    errors?: number;
  } | null;
  error?: string | null;
}

export interface DocumentHistoryItem {
  id: string;
  eventType: string;
  source: string;
  title: string;
  summary: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  kind: 'audit' | 'fiscal-event';
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedCollection<T> {
  items: T[];
  meta?: PaginationMeta;
  pagination?: PaginationInfo;
}

// ============================================
// Manifestacao Types
// ============================================

export type ManifestacaoStatus =
  | 'nao_aplicavel'      // Not a recipient
  | 'pendente_ciencia'   // Awaiting ciencia (resNFe received)
  | 'ciencia_registrada' // Ciencia ok, awaiting final manifestation
  | 'confirmada'         // 210200
  | 'desconhecida'       // 210220
  | 'nao_realizada';     // 210240

export interface ManifestacaoRequest {
  documentId: string;
  tipo: ManifestacaoTipo;
  justificativa?: string;
}

export interface PendingManifestation {
  document: Document;
  daysPending: number;
}

export interface PendingCiencia {
  id: string;
  chave: string;
  emitCnpj: string;
  emitRazaoSocial: string;
  valorTotal: string;
  dataEmissao: string;
  nsu: string;
  companyId: string;
  companyName: string;
  daysPending: number;
  isUrgent: boolean;
}

export interface AwaitingFinal {
  document: Document;
  cienciaData: string;
  daysUntilDeadline: number;
  isNearDeadline: boolean;
}

export interface ManifestacaoHistoryItem {
  id?: string;
  document: Document;
  tipo: ManifestacaoTipo;
  data: string;
  justificativa?: string;
  status?: 'completed' | 'failed';
  protocolo?: string;
  erro?: string;
}

// ============================================
// Filter Types
// ============================================

export interface DocumentFilters {
  companyId?: string;
  docType?: DocType;
  situacao?: Situacao;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ============================================
// Form Types
// ============================================

export interface CompanyFormData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  ie?: string;
  im?: string;
  uf: string;
  monitorNfe: boolean;
  monitorCte: boolean;
  monitorMdfe: boolean;
}

export interface CertificateUploadData {
  companyId: string;
  file: File;
  password: string;
}

// ============================================
// NFSe Types
// ============================================

export type NfseTipo = 'abrasf' | 'rpa';
export type NfseSyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export interface MunicipioInfo {
  codigo: string;
  nome: string;
  uf: string;
  tipo: NfseTipo;
  versaoAbrasf?: string;
  urlProducao?: string;
  urlHomologacao?: string;
  requiresRpa: boolean;
}

export interface NfseConfig {
  companyId: string;
  codigoMunicipio: string;
  nomeMunicipio: string;
  uf: string;
  tipo: NfseTipo;
  versaoAbrasf?: string;
  isActive: boolean;
  rpaLogin?: string;
  rpaPassword?: string;
  inscricaoMunicipal?: string;
  lastSync?: string;
  lastError?: string;
  syncStatus: NfseSyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NfseConfigFormData {
  codigoMunicipio: string;
  inscricaoMunicipal?: string;
  rpaLogin?: string;
  rpaPassword?: string;
}

export interface NfseTestResult {
  success: boolean;
  message: string;
  details?: string;
}
