import { DOCUMENT_TYPE_LABELS } from "../models/templateSchema";

export default function DetectedFields({ fields, documentType, blocks = [] }) {
  if (!fields?.length) return null;
  const automatic = fields.filter(field => field.source === "detected");
  const technical = fields.filter(field => field.source === "placeholder");
  return <section className="studio-detected">
    <div><strong>Предложено полей: {fields.length}</strong><span>Тип документа: {DOCUMENT_TYPE_LABELS[documentType] || DOCUMENT_TYPE_LABELS.other}. Смысловых блоков найдено: {blocks.filter(block => block.textFragment).length}. Автоматически найдено: {automatic.length}. По техническим меткам: {technical.length}.</span></div>
    <div className="studio-field-chips">{fields.slice(0, 12).map(field => <span key={field.id}>{field.label}</span>)}</div>
  </section>;
}
