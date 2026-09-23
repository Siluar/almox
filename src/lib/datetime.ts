import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * SQLite CURRENT_TIMESTAMP grava 'YYYY-MM-DD HH:MM:SS' em UTC, sem fuso.
 * Sem essa normalização, o JS interpretaria a string como hora local.
 */
export function parseDbDate(value: string): Date {
  if (typeof value === "string" && !/[zZ]$/.test(value) && !/[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value.replace(" ", "T") + "Z");
  }
  return new Date(value);
}

export function formatDbDate(value: string, pattern = "dd/MM HH:mm"): string {
  const date = parseDbDate(value);
  if (isNaN(date.getTime())) return "-";
  return format(date, pattern, { locale: ptBR });
}