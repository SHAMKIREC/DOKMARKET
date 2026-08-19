export const DOCUMENT_MODEL_ERROR_CODES = Object.freeze({
  UNSUPPORTED_SCENARIO: "UNSUPPORTED_DOCUMENT_SCENARIO",
  INVALID_MODEL: "DOCUMENT_MODEL_INVALID",
});

export function documentModelError(code, message, field = "") {
  return { code, message, field };
}

