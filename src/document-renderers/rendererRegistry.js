import { renderDocx } from "./docx/renderDocx.js";

const registry = new Map([
  ["docx:docxtemplater", renderDocx],
]);

export function getRenderer(format, renderer) {
  return registry.get(`${format}:${renderer}`) || null;
}

export function hasRenderer(format, renderer) {
  return registry.has(`${format}:${renderer}`);
}
