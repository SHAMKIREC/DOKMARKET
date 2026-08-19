import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { normalizePlaceholderKey } from "./docxPlaceholderService.js";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const WORD_XML_PATTERN = /^word\/(?:document|header\d+|footer\d+)\.xml$/;

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function countOccurrences(source = "", search = "") {
  if (!search) return 0;
  return String(source).split(search).length - 1;
}

function visibleTextFromXml(xml = "") {
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function analyzeDocxReplacements({ template, fields = [], values = {} }) {
  if (!(template instanceof ArrayBuffer) && !(template instanceof Uint8Array)) throw new Error("Для проверки нужен исходный DOCX.");
  const zip = new PizZip(template);
  const xmlParts = Object.keys(zip.files)
    .filter(path => WORD_XML_PATTERN.test(path))
    .map(path => zip.file(path)?.asText() || "");
  const visibleText = xmlParts.map(visibleTextFromXml).join("\n");
  const activeFields = fields.filter(field => field.selected !== false);
  const items = activeFields.map(field => {
    const value = values[field.key];
    const isEmpty = field.type === "checkbox" ? !value : String(value ?? "").trim() === "";
    const searchText = field.source === "placeholder" ? field.searchText || `{{${field.key}}}` : field.searchText || "";
    const occurrences = field.source === "placeholder"
      ? countOccurrences(visibleText, searchText)
      : xmlParts.reduce((total, xml) => total + countOccurrences(xml, escapeXml(searchText)), 0);
    let status = "ready";
    if (field.required && isEmpty) status = "required_empty";
    else if (!occurrences) status = "not_found";
    else if (occurrences > 1) status = "multiple";
    return {
      fieldId: field.id,
      key: field.key,
      label: field.label,
      semanticBlock: field.semanticBlock || "other",
      searchText,
      value: value ?? "",
      occurrences,
      required: Boolean(field.required),
      isEmpty,
      status,
      critical: status === "required_empty" || (status === "not_found" && field.required),
    };
  });
  return {
    items,
    summary: {
      selected: items.length,
      filled: items.filter(item => !item.isEmpty).length,
      requiredEmpty: items.filter(item => item.status === "required_empty").length,
      replacements: items.reduce((total, item) => total + item.occurrences, 0),
      warnings: items.filter(item => item.status === "not_found" || item.status === "multiple").length,
      critical: items.filter(item => item.critical).length,
    },
  };
}

export function flatValuesToNested(values = {}) {
  const nested = {};
  Object.entries(values).forEach(([rawKey, value]) => {
    const key = normalizePlaceholderKey(rawKey);
    if (!key) return;
    const segments = key.split(".");
    let cursor = nested;
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) cursor[segment] = value ?? "";
      else {
        if (!cursor[segment] || typeof cursor[segment] !== "object") cursor[segment] = {};
        cursor = cursor[segment];
      }
    });
  });
  return nested;
}

export function renderGenericDocx({ template, values, fields = [], fileName = "document.docx" }) {
  if (!(template instanceof ArrayBuffer) && !(template instanceof Uint8Array)) throw new Error("Для генерации нужен исходный DOCX.");
  try {
    const zip = new PizZip(template);
    const dottedPathParser = tag => ({
      get(scope) {
        return String(tag).trim().split(".").reduce((result, key) => result?.[key], scope);
      },
    });
    const document = new Docxtemplater(zip, {
      delimiters: { start: "{{", end: "}}" },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
      parser: dottedPathParser,
    });
    const activeFields = fields.filter(field => field.selected !== false);
    const placeholderValues = Object.fromEntries(activeFields.filter(field => field.source === "placeholder").map(field => [field.key, values[field.key]]));
    document.render(flatValuesToNested(placeholderValues));

    const warnings = [];
    activeFields.filter(field => field.source !== "placeholder" && field.searchText).forEach(field => {
      const replacement = escapeXml(values[field.key] ?? "");
      const encodedSearch = escapeXml(field.searchText);
      let replacements = 0;
      Object.keys(document.getZip().files).filter(path => WORD_XML_PATTERN.test(path)).forEach(path => {
        const entry = document.getZip().file(path);
        const xml = entry?.asText() || "";
        if (!xml.includes(encodedSearch)) return;
        const occurrences = xml.split(encodedSearch).length - 1;
        document.getZip().file(path, xml.split(encodedSearch).join(replacement));
        replacements += occurrences;
      });
      if (!replacements) warnings.push(field.label);
    });
    const blob = document.getZip().generate({ type: "blob", mimeType: DOCX_MIME });
    return { blob, fileName: fileName.toLowerCase().endsWith(".docx") ? fileName : `${fileName}.docx`, mimeType: DOCX_MIME, warnings };
  } catch (cause) {
    const error = new Error("Не удалось сформировать DOCX. Проверьте placeholder-поля в исходном документе.");
    error.code = "DOCX_RENDER_FAILED";
    error.cause = cause;
    throw error;
  }
}
