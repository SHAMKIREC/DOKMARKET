import { safeString } from "./safeString.js";

export function normalizeAddress(value) {
  return safeString(value)
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+([.;])/g, "$1")
    .replace(/,{2,}/g, ",");
}
