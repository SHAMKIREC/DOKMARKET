import { createDocxtemplaterData, validatePresentationData } from "./docxtemplaterData.js";
import { docxFileName } from "./docxFileName.js";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function dependencyError(name) {
  const error = new Error(
    `${name} не передан в изолированный PoC renderer. Позже установите docxtemplater и pizzip и передайте зависимости явно.`,
  );
  error.code = "DOCX_DEPENDENCY_MISSING";
  return error;
}

export async function renderDocx({ model, template, dependencies = {}, options = {} }) {
  const Docxtemplater = dependencies.Docxtemplater;
  const PizZip = dependencies.PizZip;
  if (!Docxtemplater) throw dependencyError("Docxtemplater");
  if (!PizZip) throw dependencyError("PizZip");
  if (!(template instanceof ArrayBuffer) && !(template instanceof Uint8Array)) {
    const error = new Error("DOCX renderer ожидает настоящий template.docx как ArrayBuffer или Uint8Array.");
    error.code = "DOCX_TEMPLATE_MISSING";
    throw error;
  }

  const data = createDocxtemplaterData(model, options);
  const validation = validatePresentationData(data);
  if (!validation.valid) {
    const error = new Error(`Presentation data содержит недопустимые значения: ${validation.errors.join(", ")}`);
    error.code = "DOCX_PRESENTATION_INVALID";
    error.fields = validation.errors;
    throw error;
  }

  const zip = new PizZip(template);
  const dottedPathParser = tag => ({
    get(scope) {
      return tag.split(".").reduce((value, key) => value?.[key], scope);
    },
  });
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
    parser: dottedPathParser,
  });
  doc.render(data);
  const blob = doc.getZip().generate({ type: "blob", mimeType: DOCX_MIME });
  return {
    blob,
    fileName: docxFileName(model),
    mimeType: DOCX_MIME,
    metadata: {
      format: "docx",
      renderer: "docxtemplater",
      templateVersion: model.templateVersion,
      generatedAt: model.generatedAt,
      sizeBytes: blob.size,
    },
  };
}
