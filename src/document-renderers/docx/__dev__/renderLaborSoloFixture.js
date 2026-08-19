import { buildDocumentModel } from "../../../document-model/builders/buildDocumentModel.js";
import { laborSoloCompleteClaimData } from "../../../document-model/__fixtures__/labor-solo.complete.js";
import { renderDocx } from "../renderDocx.js";

// Изолированный helper не импортируется приложением. Зависимости и template.docx
// должны быть переданы вызывающим dev-скриптом вручную.
export async function renderLaborSoloFixture({ template, Docxtemplater, PizZip }) {
  const result = buildDocumentModel(laborSoloCompleteClaimData, {
    generatedAt: "2026-07-17T12:00:00.000Z",
    source: "fixture",
  });
  if (!result.ok) {
    const error = new Error(result.error.message);
    error.details = result;
    throw error;
  }
  return renderDocx({
    model: result.model,
    template,
    dependencies: { Docxtemplater, PizZip },
  });
}
