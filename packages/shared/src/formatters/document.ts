import type { DocType, DocumentStatus } from '../types/documents';

/**
 * Formats a document number with leading zeros
 * @param numero - Document number
 * @param digits - Number of digits (default: 9)
 * @returns Formatted number string
 */
export function formatDocumentNumber(numero: number | string, digits: number = 9): string {
  const num = typeof numero === 'string' ? parseInt(numero, 10) : numero;
  return String(num).padStart(digits, '0');
}

/**
 * Formats a document series with leading zeros
 * @param serie - Document series
 * @returns Formatted series string
 */
export function formatSerie(serie: number | string): string {
  const num = typeof serie === 'string' ? parseInt(serie, 10) : serie;
  return String(num).padStart(3, '0');
}

/**
 * Gets a human-readable label for a document type
 */
export function getDocTypeLabel(docType: DocType): string {
  const labels: Record<DocType, string> = {
    NFE: 'NF-e',
    NFSE: 'NFS-e',
    CTE: 'CT-e',
    MDFE: 'MDF-e',
    SAT: 'SAT',
    NFCE: 'NFC-e',
  };
  return labels[docType] || docType;
}

/**
 * Gets a human-readable label for a document status
 */
export function getStatusLabel(status: DocumentStatus): string {
  const labels: Record<DocumentStatus, string> = {
    autorizada: 'Autorizada',
    cancelada: 'Cancelada',
    inutilizada: 'Inutilizada',
    denegada: 'Denegada',
  };
  return labels[status] || status;
}

/**
 * Gets a color class for a document status
 */
export function getStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    autorizada: 'text-green-600 bg-green-100',
    cancelada: 'text-red-600 bg-red-100',
    inutilizada: 'text-gray-600 bg-gray-100',
    denegada: 'text-orange-600 bg-orange-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}

/**
 * Gets a color class for a document type
 */
export function getDocTypeColor(docType: DocType): string {
  const colors: Record<DocType, string> = {
    NFE: 'text-blue-600 bg-blue-100',
    NFSE: 'text-purple-600 bg-purple-100',
    CTE: 'text-orange-600 bg-orange-100',
    MDFE: 'text-teal-600 bg-teal-100',
    SAT: 'text-pink-600 bg-pink-100',
    NFCE: 'text-cyan-600 bg-cyan-100',
  };
  return colors[docType] || 'text-gray-600 bg-gray-100';
}

/**
 * Formats a document reference (type + number + series)
 */
export function formatDocumentRef(docType: DocType, numero: number, serie: number): string {
  return `${getDocTypeLabel(docType)} ${formatDocumentNumber(numero)}/${formatSerie(serie)}`;
}
