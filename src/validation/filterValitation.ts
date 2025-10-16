/**
 * Validation utilities for filter inputs
 * These are lighter than form validations - they just check format
 */

/**
 * Validate ICO format (8 digits with checksum)
 */
export function validateFilterICO(ico: string): { valid: boolean; error?: string } {
  if (!ico || ico.trim() === '') {
    return { valid: true }; // Empty is valid for filters (means no filter)
  }

  // Must be 8 digits
  if (!/^[0-9]{8}$/.test(ico)) {
    return { valid: false, error: 'IČO musí mít 8 číslic' };
  }

  // Checksum validation
  const weights = [8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(ico[i], 10) * weights[i];
  }
  const mod = sum % 11;
  const check = mod === 0 ? 1 : mod === 1 ? 0 : 11 - mod;
  
  if (check !== parseInt(ico[7], 10)) {
    return { valid: false, error: 'IČO není platné (kontrolní součet nesouhlasí)' };
  }

  return { valid: true };
}

/**
 * Validate DIC format
 */
export function validateFilterDIC(
  prefix: string | null, 
  value: string
): { valid: boolean; error?: string } {
  // Empty is valid (no filter applied)
  if (!prefix || !value || value.trim() === '') {
    return { valid: true };
  }

  // For CZ and SK, validate digit count
  if (prefix === 'CZ' || prefix === 'SK') {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 10) {
      return { 
        valid: false, 
        error: 'DIČ musí obsahovat 8–10 číslic' 
      };
    }
  }

  // For "vlastní" (custom), allow any format
  // This is intentional - users might filter by partial/foreign DICs

  return { valid: true };
}

/**
 * Check if ICO input should be considered for filtering
 * (autocomplete mode - partial matching allowed)
 */
export function shouldFilterByICO(ico: string): boolean {
  if (!ico || ico.trim() === '') return false;
  
  // In autocomplete mode, allow partial ICO (at least 3 digits)
  if (ico.length >= 3 && /^[0-9]+$/.test(ico)) {
    return true;
  }
  
  return false;
}

/**
 * Check if DIC input should be considered for filtering
 * (autocomplete mode - partial matching allowed)
 */
export function shouldFilterByDIC(prefix: string | null, value: string): boolean {
  if (!prefix || !value || value.trim() === '') return false;
  
  // In autocomplete mode, allow partial DIC (at least 3 characters)
  if (value.length >= 3) {
    return true;
  }
  
  return false;
}