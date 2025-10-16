import { DIC_PREFIXES } from "../config/contactFilterConfig";

/**
 * Split bank account string into account number and bank code
 * Format: "123456789/0100" -> { accountNumber: "123456789", bankCode: "0100" }
 */
export function splitBankAccount(bankAccount: string | null | undefined): { 
  accountNumber: string; 
  bankCode: string;
} {
  if (!bankAccount) return { accountNumber: '', bankCode: '' };
  const parts = bankAccount.split('/');
  return {
    accountNumber: parts[0] || '',
    bankCode: parts[1] || '',
  };
}

/**
 * Combine account number and bank code into standard format
 * Format: "123456789" + "0100" -> "123456789/0100"
 */
export function combineBankAccount(accountNumber: string, bankCode: string): string {
  if (!accountNumber && !bankCode) return '';
  if (!bankCode) return accountNumber;
  return `${accountNumber}/${bankCode}`;
}

/**
 * Split DIC into prefix and value
 * Format: "CZ12345678" -> { prefix: "CZ", value: "12345678" }
 */
export function splitDIC(dic: string | null | undefined): { 
  prefix: string | null; 
  value: string;
} {
  if (!dic) return { prefix: null, value: '' };
  
  // Check if starts with known prefix
  for (const prefix of DIC_PREFIXES) {
    if (prefix !== 'vlastní' && dic.startsWith(prefix)) {
      return {
        prefix,
        value: dic.substring(prefix.length),
      };
    }
  }
  
  // If no known prefix, it's custom
  return { prefix: 'vlastní', value: dic };
}

/**
 * Combine DIC prefix and value
 * Format: "CZ" + "12345678" -> "CZ12345678"
 */
export function combineDIC(prefix: string | null, value: string): string {
  if (!value) return '';
  if (!prefix || prefix === 'vlastní') return value;
  return `${prefix}${value}`;
}