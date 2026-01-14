import { XMLParser } from 'fast-xml-parser';

export const defaultParserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: true,
  trimValues: true,
};

export function createParser() {
  return new XMLParser(defaultParserOptions);
}

export function parseDate(dateString: string): Date {
  // Handle ISO 8601 format (2024-01-15T10:30:00-03:00)
  if (dateString.includes('T')) {
    return new Date(dateString);
  }

  // Handle YYYYMMDD format
  if (dateString.length === 8 && !dateString.includes('-')) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return new Date(`${year}-${month}-${day}`);
  }

  // Handle YYYY-MM-DD format
  return new Date(dateString);
}

export function parseDecimal(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value.replace(',', '.')) || 0;
}

export function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function extractCnpjCpf(obj: Record<string, unknown>): string {
  return (obj?.CNPJ as string) || (obj?.CPF as string) || '';
}

export function buildSearchContent(parts: (string | undefined | null)[]): string {
  return parts
    .filter((p): p is string => !!p)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join(' ');
}
