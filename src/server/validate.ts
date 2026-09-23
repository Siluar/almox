export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): boolean {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0;
}

export function isNonNegativeNumber(value: unknown): boolean {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0;
}

export function toId(value: unknown): number | null {
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value);
  return s.trim() === "" ? null : s;
}