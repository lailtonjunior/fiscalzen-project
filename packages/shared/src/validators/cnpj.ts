/**
 * Validates a CNPJ (Brazilian company registration number)
 * @param cnpj - The CNPJ string (with or without formatting)
 * @returns true if valid, false otherwise
 */
export function isValidCnpj(cnpj: string): boolean {
  // Remove non-numeric characters
  const cleaned = cnpj.replace(/\D/g, '');

  // Must have 14 digits
  if (cleaned.length !== 14) {
    return false;
  }

  // Check for known invalid patterns
  if (/^(\d)\1{13}$/.test(cleaned)) {
    return false;
  }

  // Validate first check digit
  let sum = 0;
  let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight[i];
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cleaned.charAt(12)) !== firstDigit) {
    return false;
  }

  // Validate second check digit
  sum = 0;
  weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight[i];
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;

  return parseInt(cleaned.charAt(13)) === secondDigit;
}

/**
 * Formats a CNPJ string with punctuation
 * @param cnpj - Raw CNPJ digits
 * @returns Formatted CNPJ (XX.XXX.XXX/XXXX-XX)
 */
export function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) {
    return cnpj;
  }
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Removes formatting from a CNPJ
 * @param cnpj - Formatted CNPJ
 * @returns Raw digits only
 */
export function cleanCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}
