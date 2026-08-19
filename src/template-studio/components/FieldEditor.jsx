import { FIELD_TYPES, SEMANTIC_BLOCKS, SEMANTIC_BLOCK_LABELS } from "../models/templateSchema";

const TYPE_LABELS = {
  text: "Текст",
  textarea: "Большой текст",
  number: "Число",
  money: "Деньги",
  date: "Дата",
  email: "Email",
  phone: "Телефон",
  select: "Список",
  checkbox: "Флажок",
};

export default function FieldEditor({ field, onChange }) {
  const update = updates => onChange({ ...field, ...updates });
  const confidenceLabel = field.confidence >= .85 ? "Высокая" : field.confidence >= .65 ? "Средняя" : "Низкая";
  return <article className="studio-field-editor">
    <div className="studio-field-source">
      <div><span>{field.source === "placeholder" ? "Техническая метка" : field.source === "manual" ? "Добавлено вручную" : "Найдено в документе"}</span><strong>{field.source === "placeholder" ? field.label : field.searchText}</strong><small>Найдено в документе: {field.occurrenceCount || 1} {field.occurrenceCount === 1 ? "раз" : "раза"}</small></div>
      <label className="studio-checkbox"><input type="checkbox" checked={field.selected !== false} onChange={event => update({ selected: event.target.checked })} />Использовать</label>
    </div>
    <div className="studio-detection-meta"><span>Блок: {SEMANTIC_BLOCK_LABELS[field.semanticBlock] || SEMANTIC_BLOCK_LABELS.other}</span><span className={`confidence-${confidenceLabel.toLowerCase()}`}>Уверенность: {confidenceLabel.toLowerCase()}</span></div>
    {(field.occurrenceCount || 1) > 1 && <p className="studio-repeat-warning"><i className="fa-solid fa-arrows-rotate" />Это значение встречается несколько раз. При заполнении оно будет заменено во всех найденных местах.</p>}
    <div className="studio-form-grid">
      <label className="studio-label"><span>Название поля</span><input value={field.label} onChange={event => update({ label: event.target.value })} /></label>
      <label className="studio-label"><span>Тип</span><select value={field.type} onChange={event => update({ type: event.target.value })}>{FIELD_TYPES.map(type => <option value={type} key={type}>{TYPE_LABELS[type]}</option>)}</select></label>
      <label className="studio-label"><span>Смысловой блок</span><select value={field.semanticBlock || "other"} onChange={event => update({ semanticBlock: event.target.value })}>{SEMANTIC_BLOCKS.map(block => <option value={block.id} key={block.id}>{block.title}</option>)}</select></label>
      <label className="studio-label studio-wide"><span>Подсказка</span><input value={field.hint || ""} onChange={event => update({ hint: event.target.value })} placeholder="Что нужно указать пользователю" /></label>
      {field.type === "select" && <label className="studio-label studio-wide"><span>Варианты через запятую</span><input value={(field.options || []).join(", ")} onChange={event => update({ options: event.target.value.split(",").map(item => item.trim()).filter(Boolean) })} placeholder="Вариант 1, Вариант 2" /></label>}
    </div>
    <div className="studio-field-options"><label className="studio-checkbox"><input type="checkbox" checked={field.required} onChange={event => update({ required: event.target.checked })} />Обязательное поле</label><label>Порядок <input type="number" min="1" value={field.order + 1} onChange={event => update({ order: Math.max(0, Number(event.target.value || 1) - 1) })} /></label></div>
  </article>;
}
