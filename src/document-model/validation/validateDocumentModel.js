import { DOCUMENT_MODEL_ERROR_CODES, documentModelError } from "./documentModelErrors.js";

function containsInvalidValue(value) {
  if (value === undefined) return true;
  if (typeof value === "number" && !Number.isFinite(value)) return true;
  if (Array.isArray(value)) return value.some(containsInvalidValue);
  if (value && typeof value === "object") return Object.values(value).some(containsInvalidValue);
  return false;
}

export function validateDocumentModel(model) {
  const errors = [];
  const add = (field, message) => errors.push(documentModelError(
    DOCUMENT_MODEL_ERROR_CODES.INVALID_MODEL,
    message,
    field,
  ));

  if (!model || typeof model !== "object") {
    add("model", "DocumentModel не создан.");
    return { valid: false, errors };
  }
  if (!model.claimant?.fullName) add("claimant.fullName", "Не указано ФИО заявителя.");
  if (!model.respondent?.name) add("respondent.name", "Не указано наименование работодателя.");
  if (!model.respondent?.address) add("respondent.address", "Не указан адрес работодателя.");
  if (!(Number(model.facts?.debt?.outstandingAmount) > 0)) {
    add("facts.debt.outstandingAmount", "Сумма задолженности должна быть больше нуля.");
  }
  if (!Array.isArray(model.demands) || model.demands.length === 0) {
    add("demands", "Не сформированы требования заявителя.");
  }
  if (containsInvalidValue(model)) add("model", "DocumentModel содержит undefined или нечисловое значение.");
  return { valid: errors.length === 0, errors };
}
