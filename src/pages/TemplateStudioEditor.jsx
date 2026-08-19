import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import FieldEditor from "@/template-studio/components/FieldEditor";
import { DOCUMENT_TYPES, SEMANTIC_BLOCKS, SEMANTIC_BLOCK_LABELS } from "@/template-studio/models/templateSchema";
import { getTemplateById, getTemplateVersion, updateTemplateFields } from "@/template-studio/services/templateStorageService";
import { StudioFrame, StudioNavigation } from "./TemplateStudio";

export default function TemplateStudioEditor() {
  const { templateId } = useParams();
  const template = getTemplateById(templateId);
  const version = template ? getTemplateVersion(template.currentVersionId) : null;
  const [fields, setFields] = useState(() => version?.fields || []);
  const [documentType, setDocumentType] = useState(() => version?.documentType || "other");
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState({ searchText: "", label: "", type: "text", semanticBlock: "other", required: false, hint: "" });

  if (!template || !version) return <StudioFrame><StudioNavigation /><section className="studio-empty studio-glass"><h2>Шаблон не найден</h2><p>Вернитесь в список шаблонов и выберите существующий документ.</p></section></StudioFrame>;

  function updateField(updated) {
    setFields(current => current.map(field => field.id === updated.id ? updated : field));
    setMessage("");
  }

  function save() {
    if (fields.some(field => !field.label.trim())) return setMessage("У каждого поля должно быть название.");
    try {
      updateTemplateFields(template.id, fields, { documentType });
      setMessage("Поля сохранены.");
    } catch {
      setMessage("Не удалось сохранить поля.");
    }
  }

  function addManualField(event) {
    event.preventDefault();
    if (!manual.searchText.trim() || !manual.label.trim()) return setMessage("Укажите текст в документе и название поля.");
    const id = `manual-${Date.now()}`;
    setFields(current => [...current, {
      id,
      key: `manual.field${Date.now()}`,
      searchText: manual.searchText.trim(),
      detectedText: manual.searchText.trim(),
      label: manual.label.trim(),
      type: manual.type,
      required: manual.required,
      hint: manual.hint.trim(),
      options: [],
      order: current.length,
      source: "manual",
      selected: true,
      group: "other",
      semanticBlock: manual.semanticBlock,
      confidence: 1,
      occurrenceCount: 1,
    }]);
    setManual({ searchText: "", label: "", type: "text", semanticBlock: "other", required: false, hint: "" });
    setMessage("Поле добавлено. Сохраните настройки.");
  }

  function selectMatching(predicate) {
    setFields(current => current.map(field => ({ ...field, selected: predicate(field) })));
    setMessage("");
  }

  const structuredBlocks = SEMANTIC_BLOCKS.map(block => ({
    ...block,
    analysis: version.blocks?.find(item => item.id === block.id),
    fields: [...fields].filter(field => {
      const blockId = field.confidence < .65 ? "other" : field.semanticBlock || "other";
      return blockId === block.id;
    }).sort((a, b) => a.order - b.order),
  })).filter(block => block.fields.length || block.analysis?.textFragment);
  const duplicateLabels = Object.values(fields.reduce((counts, field) => {
    const label = field.label.trim();
    const normalized = label.toLocaleLowerCase("ru");
    if (label) counts[normalized] = { label: counts[normalized]?.label || label, count: (counts[normalized]?.count || 0) + 1 };
    return counts;
  }, Object.create(null))).filter(item => item.count > 1).map(item => item.label);

  return <StudioFrame>
    <StudioNavigation><Link className="studio-primary" to={`/template-studio/${template.id}/fill`}>Перейти к заполнению</Link></StudioNavigation>
    <header><span className="studio-kicker">Настройка формы</span><h1 className="studio-title">{template.title}</h1><p className="studio-copy">Исходный файл: {version.sourceFileName}. Подтвердите найденные данные или добавьте поле вручную.</p></header>
    <section className="studio-document-type studio-glass"><label className="studio-label"><span>Тип документа</span><select value={documentType} onChange={event => setDocumentType(event.target.value)}>{DOCUMENT_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select><small>Тип определён автоматически по заголовкам документа. При необходимости его можно изменить.</small></label></section>
    <section style={{ marginTop: 25 }}><h2 style={{ color: "#fff", fontSize: "1.15rem", margin: "0 0 6px" }}>Структура документа</h2><p className="studio-copy">Мы разделили документ на смысловые блоки. Проверьте, какие данные нужно сделать полями для заполнения.</p>
      {duplicateLabels.length > 0 && <p className="studio-duplicate-warning"><i className="fa-solid fa-triangle-exclamation" />Есть несколько полей с одинаковыми названиями: {duplicateLabels.map(label => `«${label}»`).join(", ")}. Лучше уточнить названия, например: «Дата рождения заявителя», «Дата начала работы», «Дата подписи».</p>}
      {fields.length ? <><div className="studio-quick-actions">
        <button type="button" onClick={() => selectMatching(field => field.confidence >= .85)}>Выбрать все с высокой уверенностью</button>
        <button type="button" onClick={() => selectMatching(() => false)}>Снять выбор со всех</button>
        <button type="button" onClick={() => selectMatching(field => field.group === "contacts")}>Выбрать контакты</button>
        <button type="button" onClick={() => selectMatching(field => field.group === "organization")}>Выбрать реквизиты</button>
        <button type="button" onClick={() => selectMatching(field => ["amounts", "dates"].includes(field.group))}>Выбрать суммы и даты</button>
      </div>
      <div className="studio-group-list">{structuredBlocks.map(block => <section className="studio-field-group studio-semantic-block" key={block.id}><div className="studio-group-heading"><div><h3>{block.title}</h3><p>{block.description}</p></div><span>{block.fields.length}</span></div>{block.analysis?.textFragment && <details className="studio-fragment"><summary>Фрагмент блока</summary><p>{block.analysis.textFragment}</p></details>}<div className="studio-editor-list">{block.fields.map(field => <FieldEditor field={field} onChange={updateField} key={field.id} />)}</div>{!block.fields.length && <p className="studio-block-empty">В этом блоке переменные данные не найдены.</p>}</section>)}</div></>
        : <div className="studio-notice" style={{ marginTop: 14 }}>Мы не нашли данные автоматически. Добавьте поля вручную: укажите текст из документа, который нужно заменить при заполнении.</div>}
    </section>
    <section className="studio-panel studio-glass" style={{ marginTop: 26 }}>
      <h2 style={{ color: "#fff", fontSize: "1.15rem", margin: "0 0 6px" }}>Добавить поле вручную</h2>
      <p className="studio-copy" style={{ marginBottom: 18 }}>Скопируйте точный текст из документа, который нужно заменять при заполнении.</p>
      <form className="studio-form-grid" onSubmit={addManualField}>
        <label className="studio-label"><span>Какой текст заменить в документе</span><input value={manual.searchText} onChange={event => setManual(current => ({ ...current, searchText: event.target.value }))} placeholder="Например, 330 000" /></label>
        <label className="studio-label"><span>Название поля</span><input value={manual.label} onChange={event => setManual(current => ({ ...current, label: event.target.value }))} placeholder="Например, Сумма задолженности" /></label>
        <label className="studio-label"><span>Тип поля</span><select value={manual.type} onChange={event => setManual(current => ({ ...current, type: event.target.value }))}><option value="text">Текст</option><option value="textarea">Большой текст</option><option value="number">Число</option><option value="money">Деньги</option><option value="date">Дата</option><option value="email">Email</option><option value="phone">Телефон</option><option value="select">Список</option><option value="checkbox">Флажок</option></select></label>
        <label className="studio-label"><span>Смысловой блок</span><select value={manual.semanticBlock} onChange={event => setManual(current => ({ ...current, semanticBlock: event.target.value }))}>{SEMANTIC_BLOCKS.map(block => <option value={block.id} key={block.id}>{SEMANTIC_BLOCK_LABELS[block.id]}</option>)}</select></label>
        <label className="studio-label studio-wide"><span>Подсказка для заполняющего</span><input value={manual.hint} onChange={event => setManual(current => ({ ...current, hint: event.target.value }))} placeholder="Что нужно указать в этом поле" /></label>
        <label className="studio-checkbox studio-wide"><input type="checkbox" checked={manual.required} onChange={event => setManual(current => ({ ...current, required: event.target.checked }))} />Обязательное поле</label>
        <div className="studio-wide"><button className="studio-secondary" type="submit">Добавить поле</button></div>
      </form>
    </section>
    {message && <p className={/сохранены|добавлено/i.test(message) ? "studio-file-ok" : "studio-error"}>{message}</p>}
    <div className="studio-actions"><button className="studio-primary" type="button" onClick={save}>Сохранить поля</button><Link className="studio-secondary" to={`/template-studio/${template.id}/fill`}>Перейти к заполнению</Link></div>
  </StudioFrame>;
}
