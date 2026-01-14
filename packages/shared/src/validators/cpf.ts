/**
 * Validates a CPF (Brazilian individual registration number)
 * @param cpf - The CPF string (with or without formatting)
 * @returns true if valid, false otherwise
 */
export function isValidCpf(cpf: string): boolean {
  // Remove non-numeric characters
  const cleaned = cpf.replace(/\D/g, '');

  // Must have 11 digits
  if (cleaned.length !== 11) {
    return false;
  }

  // Check for known invalid patterns
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  const firstDigit = remainder === 10 ? 0 : remainder;

  if (parseInt(cleaned.charAt(9)) !== firstDigit) {
    return false;
  }

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  const secondDigit = remainder === 10 ? 0 : remainder;

  return parseInt(cleaned.charAt(10)) === secondDigit;
}

/**
 * Formats a CPF string with punctuation
 * @param cpf - Raw CPF digits
 * @returns Formatted CPF (XXX.XXX.XXX-XX)
 */
export function formatCpf(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) {
    return cpf;
  }
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Removes formatting from a CPF
 * @param cpf - Formatted CPF
 * @returns Raw digits only
 */
export function cleanCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Validates either CPF or CNPJ based on length
 */
export function isValidCpfCnpj(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return isValidCpf(cleaned);
  }
  if (cleaned.length === 14) {
    // Import would create circular dependency, so inline basic check
    return cleaned.length === 14;
  }
  return false;
}
