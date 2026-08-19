import { safeString } from "./safeString.js";

export function normalizeName(value) {
  return safeString(value)
    .split(" ")
    .filter(Boolean)
    .map(part => part.split("-").map(fragment => fragment
      ? `${fragment.charAt(0).toLocaleUpperCase("ru-RU")}${fragment.slice(1).toLocaleLowerCase("ru-RU")}`
      : "").join("-"))
    .join(" ");
}

export function shortName(value) {
  const parts = normalizeName(value).split(" ").filter(Boolean);
  if (parts.length < 2) return parts[0] || "";
  return `${parts[0]} ${parts.slice(1).map(part => `${part.charAt(0)}.`).join(" ")}`;
}
