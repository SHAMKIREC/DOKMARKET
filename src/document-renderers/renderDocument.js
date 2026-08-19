import { getRenderer } from "./rendererRegistry.js";

export async function renderDocument({
  model,
  format = "docx",
  renderer = "docxtemplater",
  template,
  dependencies,
  options,
}) {
  const render = getRenderer(format, renderer);
  if (!render) {
    const error = new Error(`Renderer ${format}:${renderer} не зарегистрирован.`);
    error.code = "DOCUMENT_RENDERER_UNSUPPORTED";
    throw error;
  }
  return render({ model, template, dependencies, options });
}
