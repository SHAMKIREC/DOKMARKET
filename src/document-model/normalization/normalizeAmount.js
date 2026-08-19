export function normalizeAmount(value) {
  if (value === null || value === undefined || value === "") return 0;
  const normalized = typeof value === "string"
    ? value.replace(/\s/g, "").replace(",", ".")
    : value;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export function formatAmount(value, options = {}) {
  const amount = normalizeAmount(value);
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(amount);
  return options.withCurrency === false ? formatted : `${formatted} руб.`;
}

