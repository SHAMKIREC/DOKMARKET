import { safeString } from "./safeString.js";

export function normalizeDate(value) {
  const text = safeString(value);
  if (!text) return "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00`)
    : new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function formatDate(value, fallback = "") {
  const normalized = normalizeDate(value);
  if (!normalized) return fallback;
  const [year, month, day] = normalized.split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
