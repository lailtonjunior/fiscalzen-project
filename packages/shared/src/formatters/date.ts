/**
 * Formats a date as Brazilian format (DD/MM/YYYY)
 * @param date - Date object or ISO string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats a date with time as Brazilian format (DD/MM/YYYY HH:mm)
 * @param date - Date object or ISO string
 * @returns Formatted datetime string
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Formats a date with full time as Brazilian format (DD/MM/YYYY HH:mm:ss)
 * @param date - Date object or ISO string
 * @returns Formatted datetime string
 */
export function formatDateTimeFull(date: Date | string | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

/**
 * Formats a date as relative time (e.g., "2 hours ago")
 * @param date - Date object or ISO string
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'agora';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;

  return formatDate(d);
}

/**
 * Parses a Brazilian date string to Date object
 * @param dateStr - Date string in DD/MM/YYYY format
 * @returns Date object
 */
export function parseDate(dateStr: string): Date {
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    return new Date(dateStr);
  }

  const [day, month, year] = parts.map((p) => parseInt(p, 10));
  return new Date(year, month - 1, day);
}

/**
 * Gets the start of today
 */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Gets the start of the current month
 */
export function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Gets the start of the current year
 */
export function startOfYear(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
}
