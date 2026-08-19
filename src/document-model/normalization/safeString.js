export function safeString(value) {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/\s+/g, " ").trim();
  return /^(?:undefined|null|nan)$/i.test(text) ? "" : text;
}

