import { normalizeAddress, safeString } from "../normalization/index.js";

function respondentKind(source) {
  const type = safeString(source.type).toLowerCase();
  if (type.includes("ип") || type.includes("entrepreneur")) return "individual-entrepreneur";
  if (type.includes("individual") || type.includes("физ")) return "individual";
  if (safeString(source.ogrn).length === 15) return "individual-entrepreneur";
  if (safeString(source.name)) return "legal-entity";
  return "unknown";
}

export function mapRespondent(source = {}) {
  const kind = respondentKind(source);
  const name = safeString(source.name || source.displayName);
  return {
    kind,
    name,
    displayName: name,
    address: normalizeAddress(source.address),
    inn: safeString(source.inn).replace(/\D/g, ""),
    registrationNumber: safeString(source.ogrn || source.registrationNumber).replace(/\D/g, ""),
    registrationNumberLabel: kind === "individual-entrepreneur" ? "ОГРНИП" : "ОГРН",
  };
}
