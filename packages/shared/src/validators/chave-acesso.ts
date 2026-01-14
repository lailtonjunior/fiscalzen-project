/**
 * Validates a Brazilian fiscal document access key (chave de acesso)
 * @param chave - The 44-digit access key
 * @returns true if valid, false otherwise
 */
export function isValidChaveAcesso(chave: string): boolean {
  // Remove non-numeric characters
  const cleaned = chave.replace(/\D/g, '');

  // Must have 44 digits
  if (cleaned.length !== 44) {
    return false;
  }

  // Validate check digit (position 44)
  const checkDigit = parseInt(cleaned.charAt(43));
  const calculatedDigit = calculateCheckDigit(cleaned.substring(0, 43));

  return checkDigit === calculatedDigit;
}

/**
 * Calculates the check digit for an access key
 * Uses mod 11 with weights 2-9
 */
function calculateCheckDigit(key: string): number {
  let sum = 0;
  let weight = 2;

  // Process from right to left
  for (let i = key.length - 1; i >= 0; i--) {
    sum += parseInt(key.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Extracts information from an access key
 */
export interface ChaveAcessoInfo {
  uf: string;
  anoMes: string;
  cnpjEmitente: string;
  modelo: string;
  serie: string;
  numero: string;
  tipoEmissao: string;
  codigoNumerico: string;
  digitoVerificador: string;
}

/**
 * Parses an access key and extracts its components
 * @param chave - The 44-digit access key
 * @returns Parsed components or null if invalid
 */
export function parseChaveAcesso(chave: string): ChaveAcessoInfo | null {
  const cleaned = chave.replace(/\D/g, '');

  if (cleaned.length !== 44) {
    return null;
  }

  return {
    uf: cleaned.substring(0, 2),
    anoMes: cleaned.substring(2, 6),
    cnpjEmitente: cleaned.substring(6, 20),
    modelo: cleaned.substring(20, 22),
    serie: cleaned.substring(22, 25),
    numero: cleaned.substring(25, 34),
    tipoEmissao: cleaned.substring(34, 35),
    codigoNumerico: cleaned.substring(35, 43),
    digitoVerificador: cleaned.substring(43, 44),
  };
}

/**
 * Formats an access key with spaces for readability
 * @param chave - Raw 44-digit key
 * @returns Formatted key (XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX)
 */
export function formatChaveAcesso(chave: string): string {
  const cleaned = chave.replace(/\D/g, '');
  if (cleaned.length !== 44) {
    return chave;
  }
  return cleaned.replace(/(\d{4})/g, '$1 ').trim();
}

/**
 * Determines the document type from an access key
 */
export function getDocTypeFromChave(chave: string): 'NFE' | 'NFCE' | 'CTE' | 'MDFE' | 'SAT' | null {
  const info = parseChaveAcesso(chave);
  if (!info) return null;

  switch (info.modelo) {
    case '55':
      return 'NFE';
    case '65':
      return 'NFCE';
    case '57':
      return 'CTE';
    case '58':
      return 'MDFE';
    case '59':
      return 'SAT';
    default:
      return null;
  }
}
