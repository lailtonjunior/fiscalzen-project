/**
 * Formats a number as Brazilian currency (BRL)
 * @param value - The numeric value
 * @returns Formatted currency string (R$ X.XXX,XX)
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return 'R$ 0,00';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

/**
 * Formats a number with thousand separators (Brazilian format)
 * @param value - The numeric value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string (X.XXX,XX)
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined) {
    return '0';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
}

/**
 * Parses a Brazilian formatted currency string to a number
 * @param value - Formatted currency string
 * @returns Parsed number
 */
export function parseCurrency(value: string): number {
  const cleaned = value
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a number as a compact representation
 * @param value - The numeric value
 * @returns Compact string (1.5K, 2.3M, etc.)
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}
