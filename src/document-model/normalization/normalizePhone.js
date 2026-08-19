import { safeString } from "./safeString.js";

export function normalizePhone(value) {
  let digits = safeString(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (digits.length === 10) digits = `7${digits}`;
  if (!/^7\d{10}$/.test(digits)) return safeString(value);
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
}
