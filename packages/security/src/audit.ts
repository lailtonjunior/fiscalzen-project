// ============================================
// Certificate Audit Service
// ============================================

export type CertificateAction =
  | 'VIEW'
  | 'DOWNLOAD'
  | 'USE_FOR_SIGNING'
  | 'UPLOAD'
  | 'DELETE'
  | 'VALIDATE'
  | 'DECRYPT';

export type AuditStatus = 'success' | 'failure' | 'denied';

export interface AuditContext {
  tenantId: string;
  companyId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface AuditEntry {
  action: CertificateAction;
  status: AuditStatus;
  context: AuditContext;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

export interface AuditLogger {
  log(entry: AuditEntry): Promise<void>;
  query(filters: AuditQueryFilters): Promise<AuditEntry[]>;
}

export interface AuditQueryFilters {
  tenantId?: string;
  companyId?: string;
  userId?: string;
  action?: CertificateAction;
  status?: AuditStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================
// In-Memory Audit Logger (para testes)
// ============================================

export class InMemoryAuditLogger implements AuditLogger {
  private logs: AuditEntry[] = [];

  async log(entry: AuditEntry): Promise<void> {
    this.logs.push({
      ...entry,
      metadata: {
        ...entry.metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async query(filters: AuditQueryFilters): Promise<AuditEntry[]> {
    let results = [...this.logs];

    if (filters.tenantId) {
      results = results.filter((e) => e.context.tenantId === filters.tenantId);
    }
    if (filters.companyId) {
      results = results.filter((e) => e.context.companyId === filters.companyId);
    }
    if (filters.userId) {
      results = results.filter((e) => e.context.userId === filters.userId);
    }
    if (filters.action) {
      results = results.filter((e) => e.action === filters.action);
    }
    if (filters.status) {
      results = results.filter((e) => e.status === filters.status);
    }

    const offset = filters.offset || 0;
    const limit = filters.limit || 100;

    return results.slice(offset, offset + limit);
  }

  clear(): void {
    this.logs = [];
  }

  getAll(): AuditEntry[] {
    return [...this.logs];
  }
}

// ============================================
// Database Audit Logger Factory
// ============================================

export interface DatabaseAuditLoggerConfig {
  db: unknown; // Drizzle database instance
  certificateAccessLogs: unknown; // Drizzle table reference
}

/**
 * Cria um AuditLogger que persiste no banco de dados.
 * Deve ser instanciado no app/api onde o db esta disponivel.
 */
export function createDatabaseAuditLogger(
  config: DatabaseAuditLoggerConfig
): AuditLogger {
  const { db, certificateAccessLogs } = config;

  return {
    async log(entry: AuditEntry): Promise<void> {
      await (db as any).insert(certificateAccessLogs).values({
        tenantId: entry.context.tenantId,
        companyId: entry.context.companyId,
        userId: entry.context.userId,
        action: entry.action,
        status: entry.status,
        ipAddress: entry.context.ipAddress,
        userAgent: entry.context.userAgent,
        requestId: entry.context.requestId,
        metadata: entry.metadata,
        errorMessage: entry.errorMessage,
      });
    },

    async query(filters: AuditQueryFilters): Promise<AuditEntry[]> {
      // Implementacao simplificada - deve ser expandida conforme necessidade
      const results = await (db as any).query.certificateAccessLogs.findMany({
        where: (table: any, { and, eq, gte, lte }: any) => {
          const conditions = [];

          if (filters.tenantId) {
            conditions.push(eq(table.tenantId, filters.tenantId));
          }
          if (filters.companyId) {
            conditions.push(eq(table.companyId, filters.companyId));
          }
          if (filters.userId) {
            conditions.push(eq(table.userId, filters.userId));
          }
          if (filters.action) {
            conditions.push(eq(table.action, filters.action));
          }
          if (filters.status) {
            conditions.push(eq(table.status, filters.status));
          }
          if (filters.startDate) {
            conditions.push(gte(table.createdAt, filters.startDate));
          }
          if (filters.endDate) {
            conditions.push(lte(table.createdAt, filters.endDate));
          }

          return conditions.length > 0 ? and(...conditions) : undefined;
        },
        limit: filters.limit || 100,
        offset: filters.offset || 0,
        orderBy: (table: any, { desc }: any) => [desc(table.createdAt)],
      });

      return results.map((r: any) => ({
        action: r.action,
        status: r.status,
        context: {
          tenantId: r.tenantId,
          companyId: r.companyId,
          userId: r.userId,
          ipAddress: r.ipAddress,
          userAgent: r.userAgent,
          requestId: r.requestId,
        },
        metadata: r.metadata,
        errorMessage: r.errorMessage,
      }));
    },
  };
}

// ============================================
// Audit Decorator / Helper
// ============================================

/**
 * Helper para criar uma funcao auditada
 */
export function withAudit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    action: CertificateAction;
    logger: AuditLogger;
    getContext: (...args: Parameters<T>) => AuditContext;
    getMetadata?: (...args: Parameters<T>) => Record<string, unknown>;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const context = options.getContext(...args);
    const metadata = options.getMetadata?.(...args);

    try {
      const result = await fn(...args);

      await options.logger.log({
        action: options.action,
        status: 'success',
        context,
        metadata,
      });

      return result;
    } catch (error) {
      await options.logger.log({
        action: options.action,
        status: 'failure',
        context,
        metadata,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }) as T;
}

// ============================================
// Security Event Logger
// ============================================

export type SecurityEventType =
  | 'AUTH_FAILURE'
  | 'RATE_LIMIT'
  | 'SUSPICIOUS_ACTIVITY'
  | 'KEY_ROTATION'
  | 'CERTIFICATE_EXPIRED'
  | 'INVALID_CERTIFICATE'
  | 'ACCESS_DENIED';

export type SecuritySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface SecurityEventEntry {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  tenantId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityEventLogger {
  log(entry: SecurityEventEntry): Promise<void>;
}

export class ConsoleSecurityLogger implements SecurityEventLogger {
  async log(entry: SecurityEventEntry): Promise<void> {
    const level = entry.severity === 'CRITICAL' ? 'error' :
                  entry.severity === 'WARNING' ? 'warn' : 'info';

    console[level]('[SECURITY]', {
      type: entry.eventType,
      severity: entry.severity,
      description: entry.description,
      ...entry.metadata,
    });
  }
}
