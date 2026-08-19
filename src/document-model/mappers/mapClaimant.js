import {
  normalizeAddress,
  normalizeDate,
  normalizeName,
  normalizePhone,
  safeString,
  shortName,
} from "../normalization/index.js";

export function mapClaimant(worker = {}) {
  const fullName = normalizeName(worker.name || worker.fullName);
  return {
    id: safeString(worker.id),
    fullName,
    shortName: shortName(fullName),
    gender: worker.gender === "male" || worker.gender === "female" ? worker.gender : "unknown",
    birthDate: normalizeDate(worker.birthDate),
    address: normalizeAddress(worker.address),
    phone: normalizePhone(worker.phone),
    email: safeString(worker.email).toLocaleLowerCase("ru-RU"),
    position: safeString(worker.position),
  };
}
