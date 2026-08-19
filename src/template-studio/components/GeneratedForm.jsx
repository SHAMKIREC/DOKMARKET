import { SEMANTIC_BLOCKS } from "../models/templateSchema";

function FormField({ field, value, error, onChange }) {
  const common = {
    id: `generated-${field.id}`,
    value: field.type === "checkbox" ? undefined : value,
    required: field.required,
    onChange: event => onChange(field.key, field.type === "checkbox" ? event.target.checked : event.target.value),
  };
  return <label className={`studio-label ${error ? "invalid" : ""}`} htmlFor={common.id}>
    <span>{field.label}{field.required && <b> *</b>}</span>
    {field.type === "textarea" ? <textarea {...common} rows="4" />
      : field.type === "select" ? <select {...common}><option value="">Выберите вариант</option>{field.options.map(option => <option key={option}>{option}</option>)}</select>
        : field.type === "checkbox" ? <span className="studio-checkbox"><input id={common.id} type="checkbox" checked={Boolean(value)} required={field.required} onChange={common.onChange} />{field.hint || field.label}</span>
          : <input {...common} type={field.type === "phone" ? "tel" : field.type === "money" ? "number" : field.type} step={field.type === "money" ? "0.01" : undefined} />}
    {field.hint && field.type !== "checkbox" && <small>{field.hint}</small>}
    {error && <em>{error}</em>}
  </label>;
}

export default function GeneratedForm({ fields, values, errors, onChange }) {
  const sortedFields = fields.filter(field => field.selected !== false).sort((a, b) => a.order - b.order);
  return <div className="studio-fill-groups">{SEMANTIC_BLOCKS.map(block => {
    const blockFields = sortedFields.filter(field => (field.semanticBlock || "other") === block.id);
    if (!blockFields.length) return null;
    return <section className="studio-fill-group" key={block.id}><h2>{block.title}</h2><div className="studio-generated-form">{blockFields.map(field => <FormField field={field} value={values[field.key] ?? (field.type === "checkbox" ? false : "")} error={errors[field.key]} onChange={onChange} key={field.id} />)}</div></section>;
  })}</div>;
}
