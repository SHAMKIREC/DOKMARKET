import { createLocalId, readLocal, writeLocal } from "@/services/localStorageService";
import { TEMPLATE_STATUS } from "../models/templateSchema.js";

const TEMPLATES_KEY = "templateStudio:templates";
const VERSIONS_KEY = "templateStudio:versions";
const SUBMISSIONS_KEY = "templateStudio:submissions";

export function listTemplates() {
  return readLocal(TEMPLATES_KEY, []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function getTemplateById(id) {
  return listTemplates().find(template => template.id === id) || null;
}

export function getTemplateVersion(id) {
  return readLocal(VERSIONS_KEY, []).find(version => version.id === id) || null;
}

export function createTemplate({ title, description = "", sourceFileName, sourceMimeType, sourceSize, sourceBase64, fields, documentType = "other", blocks = [] }) {
  const now = new Date().toISOString();
  const templateId = createLocalId("studio-template");
  const versionId = createLocalId("studio-version");
  const version = {
    id: versionId,
    templateId,
    version: 1,
    sourceFileName,
    sourceMimeType,
    sourceSize,
    sourceBase64,
    placeholderSyntax: "double-curly",
    fields,
    documentType,
    blocks,
    createdAt: now,
    updatedAt: now,
  };
  const template = {
    id: templateId,
    title: title.trim(),
    description: description.trim(),
    status: TEMPLATE_STATUS.DRAFT,
    currentVersionId: versionId,
    createdAt: now,
    updatedAt: now,
  };
  if (writeLocal(VERSIONS_KEY, [...readLocal(VERSIONS_KEY, []), version]) === null) throw new Error("TEMPLATE_VERSION_SAVE_FAILED");
  if (writeLocal(TEMPLATES_KEY, [...listTemplates(), template]) === null) throw new Error("TEMPLATE_SAVE_FAILED");
  return template;
}

export function updateTemplateFields(templateId, fields, structure = {}) {
  const template = getTemplateById(templateId);
  if (!template) throw new Error("TEMPLATE_NOT_FOUND");
  const now = new Date().toISOString();
  const versions = readLocal(VERSIONS_KEY, []);
  const currentVersion = versions.find(version => version.id === template.currentVersionId);
  if (!currentVersion) throw new Error("TEMPLATE_VERSION_NOT_FOUND");
  const updatedVersion = { ...currentVersion, fields, ...structure, updatedAt: now };
  const updatedTemplate = { ...template, status: TEMPLATE_STATUS.READY, updatedAt: now };
  if (writeLocal(VERSIONS_KEY, versions.map(version => version.id === updatedVersion.id ? updatedVersion : version)) === null) throw new Error("TEMPLATE_VERSION_SAVE_FAILED");
  if (writeLocal(TEMPLATES_KEY, listTemplates().map(item => item.id === templateId ? updatedTemplate : item)) === null) throw new Error("TEMPLATE_SAVE_FAILED");
  return updatedTemplate;
}

export function createSubmission({ templateId, versionId, values }) {
  const submission = {
    id: createLocalId("studio-submission"),
    templateId,
    versionId,
    values,
    status: "generated",
    createdAt: new Date().toISOString(),
  };
  if (writeLocal(SUBMISSIONS_KEY, [...readLocal(SUBMISSIONS_KEY, []), submission]) === null) throw new Error("SUBMISSION_SAVE_FAILED");
  return submission;
}
