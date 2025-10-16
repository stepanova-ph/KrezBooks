export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} Kč`;
}

export function formatVatRate(rate: number): string {
  if (rate === 0) return "0% (osvobozeno)";
  if (rate === 1) return "12% (snížená)";
  if (rate === 2) return "21% (základní)";
  return `${rate}%`;
}

export function formatVatRateShort(rate: number): string {
  if (rate === 0) return "0%";
  if (rate === 1) return "12%";
  if (rate === 2) return "21%";
  return `${rate}%`;
}

export function formatNumber(
  value: number | string,
  precision: number = 2,
): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "0." + "0".repeat(precision);
  return numValue.toFixed(precision);
}

export function parseNumericInput(
  input: string,
  options: {
    allowNegative?: boolean;
    precision?: number;
  } = {},
): string {
  const { allowNegative = false, precision } = options;
  let cleaned = input;

  if (allowNegative) {
    cleaned = cleaned.replace(/[^0-9.-]/g, "");
  } else {
    cleaned = cleaned.replace(/[^0-9.]/g, "");
  }

  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }

  if (
    precision !== undefined &&
    parts.length === 2 &&
    parts[1].length > precision
  ) {
    cleaned = parts[0] + "." + parts[1].slice(0, precision);
  }

  if (allowNegative) {
    const minusCount = (cleaned.match(/-/g) || []).length;
    if (minusCount > 1) {
      cleaned = "-" + cleaned.replace(/-/g, "");
    } else if (cleaned.includes("-") && !cleaned.startsWith("-")) {
      cleaned = cleaned.replace("-", "");
    }
  }

  return cleaned;
}

export function clampNumber(value: number, min?: number, max?: number): number {
  let clamped = value;

  if (min !== undefined && clamped < min) {
    clamped = min;
  }
  if (max !== undefined && clamped > max) {
    clamped = max;
  }

  return clamped;
}
