/**
 * Filter-specific validation utilities
 * Wrappers around core validators that return validation objects
 */

import { validateICO, validateDIC } from "./validationUtils";

/**
 * Validation result object for filter inputs
 */
export interface FilterValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate ICO for filter input
 * Empty values are considered valid (no filter applied)
 */
export function validateFilterICO(ico: string): FilterValidationResult {
  if (!ico || ico.trim() === "") {
    return { valid: true }; // Empty = no filter
  }

  // Must be 8 digits
  if (ico.length > 8) {
    return { valid: false, error: "IČO musí mít 8 číslic" };
  }

  return { valid: true };
}

/**
 * Validate DIČ for filter input
 * Empty values are considered valid (no filter applied)
 */
export function validateFilterDIC(value: string): FilterValidationResult {
  if (!value || value.trim() === "") {
    return { valid: true };
  }

  // Just check basic format - starts with 2 letters
  if (value.length < 10 || !/^[A-Z]{2}/.test(value)) {
    return {
      valid: false,
      error: "DIČ musí začínat 2 písmeny (např. CZ)",
    };
  }

  return { valid: true };
}

export function shouldFilterByDIC(value: string): boolean {
  if (!value || value.trim() === "") return false;
  return value.length >= 2;
}

/**
 * Check if ICO input should be used for filtering
 * Allows filtering from the first character (no minimum length)
 * 
 * FIXED: removed 3-char minimum, now works from char 1
 */
export function shouldFilterByICO(ico: string): boolean {
  if (!ico || ico.trim() === "") return false;

  // Allow filtering with any number of digits (1-8)
  if (ico.length >= 1 && /^[0-9]+$/.test(ico)) {
    return true;
  }

  return false;
}

/**
 * Normalize filter string value
 * Trims whitespace and returns undefined for empty strings
 */
export function normalizeFilterString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Check if filter value is empty
 */
export function isFilterEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}