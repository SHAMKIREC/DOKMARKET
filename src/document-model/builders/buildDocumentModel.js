import { buildSoloDocumentModel, isSupportedSoloClaim } from "./buildSoloDocumentModel.js";
import { DOCUMENT_MODEL_ERROR_CODES, documentModelError } from "../validation/documentModelErrors.js";
import { validateDocumentModel } from "../validation/validateDocumentModel.js";

export function buildDocumentModel(claimData, options = {}) {
  if (!claimData || typeof claimData !== "object") {
    return {
      ok: false,
      unsupported: false,
      error: documentModelError(
        DOCUMENT_MODEL_ERROR_CODES.INVALID_MODEL,
        "Для построения документа требуется объект claimData.",
        "claimData",
      ),
    };
  }
  if (!isSupportedSoloClaim(claimData)) {
    return {
      ok: false,
      unsupported: true,
      error: documentModelError(
        DOCUMENT_MODEL_ERROR_CODES.UNSUPPORTED_SCENARIO,
        "PoC поддерживает только labor + individual + salary-debt (или пустой subtype).",
        "scenario",
      ),
    };
  }

  const model = buildSoloDocumentModel(claimData, options);
  const validation = validateDocumentModel(model);
  if (!validation.valid) {
    return {
      ok: false,
      unsupported: false,
      error: documentModelError(
        DOCUMENT_MODEL_ERROR_CODES.INVALID_MODEL,
        "DocumentModel не прошёл проверку.",
        "model",
      ),
      errors: validation.errors,
      model,
    };
  }
  return { ok: true, unsupported: false, model, errors: [] };
}
