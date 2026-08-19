import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import GeneratedForm from "@/template-studio/components/GeneratedForm";
import { SEMANTIC_BLOCK_LABELS } from "@/template-studio/models/templateSchema";
import { base64ToArrayBuffer } from "@/template-studio/services/docxPlaceholderService";
import { analyzeDocxReplacements, renderGenericDocx } from "@/template-studio/services/genericDocxRenderer";
import { createSubmission, getTemplateById, getTemplateVersion } from "@/template-studio/services/templateStorageService";
import { StudioFrame, StudioNavigation } from "./TemplateStudio";

function validate(fields, values) {
  const errors = {};
  fields.filter(field => field.selected !== false).forEach(field => {
    const value = values[field.key];
    const empty = field.type === "checkbox" ? !value : String(value ?? "").trim() === "";
    if (field.required && empty) errors[field.key] = "Обязательное поле.";
    else if (!empty && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) errors[field.key] = "Проверьте email.";
    else if (!empty && (field.type === "number" || field.type === "money") && !Number.isFinite(Number(value))) errors[field.key] = "Укажите число.";
    else if (!empty && field.type === "date" && Number.isNaN(new Date(value).getTime())) errors[field.key] = "Проверьте дату.";
    else if (!empty && field.type === "phone" && String(value).replace(/\D/g, "").length < 10) errors[field.key] = "Укажите корректный телефон.";
  });
  return errors;
}

function safeFileName(value) {
  const normalized = String(value).trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_");
  return `${normalized || "document"}.docx`;
}

export default function TemplateStudioFill() {
  const { templateId } = useParams();
  const template = getTemplateById(templateId);
  const version = template ? getTemplateVersion(template.currentVersionId) : null;
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [verification, setVerification] = useState(null);

  if (!template || !version) return <StudioFrame><StudioNavigation /><section className="studio-empty studio-glass"><h2>Шаблон не найден</h2><p>Вернитесь в список шаблонов и выберите существующий документ.</p></section></StudioFrame>;

  function setValue(key, value) {
    setValues(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: "" }));
    setMessage("");
    setVerification(null);
  }

  function verifyReplacements() {
    const nextErrors = validate(version.fields, values);
    setErrors(nextErrors);
    try {
      const result = analyzeDocxReplacements({
        template: base64ToArrayBuffer(version.sourceBase64),
        fields: version.fields,
        values,
      });
      setVerification({ ...result, invalidValues: Object.keys(nextErrors).length });
      if (result.summary.requiredEmpty) setMessage("Заполните обязательные поля перед скачиванием.");
      else if (result.summary.critical) setMessage("В обязательных полях есть критичные ошибки. Вернитесь к настройке полей.");
      else if (Object.keys(nextErrors).length) setMessage("Проверьте выделенные поля.");
      else setMessage(result.summary.warnings ? "Проверка завершена. Изучите предупреждения перед скачиванием." : "Проверка завершена: документ готов к скачиванию.");
    } catch (error) {
      console.error(error);
      setVerification(null);
      setMessage("Не удалось проверить исходный DOCX.");
    }
  }

  function download() {
    const nextErrors = validate(version.fields, values);
    setErrors(nextErrors);
    if (!verification) return setMessage("Сначала проверьте замены.");
    if (Object.keys(nextErrors).length || verification.summary.critical) return setMessage("Заполните обязательные поля и устраните критичные ошибки перед скачиванием.");
    try {
      const result = renderGenericDocx({
        template: base64ToArrayBuffer(version.sourceBase64),
        values,
        fields: version.fields,
        fileName: safeFileName(template.title),
      });
      createSubmission({ templateId: template.id, versionId: version.id, values });
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.fileName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setMessage(result.warnings.length
        ? `DOCX сформирован, но некоторые поля не удалось заменить: ${result.warnings.join(", ")}. Возможно, Word разбил текст на части. Попробуйте добавить поле вручную или использовать техническую метку.`
        : "DOCX сформирован.");
    } catch (error) {
      console.error(error);
      setMessage("Не удалось сформировать DOCX. Проверьте поля исходного шаблона.");
    }
  }

  return <StudioFrame>
    <StudioNavigation backTo={`/template-studio/${template.id}/edit`}><Link className="studio-secondary" to={`/template-studio/${template.id}/edit`}>Настройка полей</Link></StudioNavigation>
    <header><span className="studio-kicker">Заполнение шаблона</span><h1 className="studio-title">{template.title}</h1><p className="studio-copy">Заполните форму — данные будут подставлены в исходный DOCX.</p></header>
    <section className="studio-panel studio-glass" style={{ marginTop: 20 }}>
      <GeneratedForm fields={version.fields} values={values} errors={errors} onChange={setValue} />
      <section className="studio-check-panel">
        <div><span className="studio-kicker">Контроль документа</span><h2>Проверка перед скачиванием</h2><p className="studio-copy">Проверьте, какие данные будут заменены в документе. Если есть предупреждения, вернитесь к настройке полей.</p></div>
        <button className="studio-secondary" type="button" onClick={verifyReplacements}><i className="fa-solid fa-list-check" />Проверить замены</button>
      </section>
      {verification && <section className="studio-check-results">
        <div className="studio-check-summary">
          <span><b>{verification.summary.selected}</b>Полей выбрано</span>
          <span><b>{verification.summary.filled}</b>Заполнено</span>
          <span className={verification.summary.requiredEmpty ? "danger" : ""}><b>{verification.summary.requiredEmpty}</b>Пустых обязательных</span>
          <span><b>{verification.summary.replacements}</b>Замен будет выполнено</span>
          <span className={verification.summary.warnings ? "warning" : ""}><b>{verification.summary.warnings}</b>Предупреждений</span>
        </div>
        <div className="studio-check-list">{verification.items.map(item => {
          const status = item.status === "required_empty" ? ["Пустое обязательное поле", "danger"]
            : item.status === "not_found" ? ["Не найдено в документе", "warning"]
              : item.status === "multiple" ? ["Несколько замен", "warning"]
                : ["Готово", "ready"];
          return <article className={`studio-check-item ${status[1]}`} key={item.fieldId}>
            <div className="studio-check-item-head"><div><strong>{item.label}</strong><span>{SEMANTIC_BLOCK_LABELS[item.semanticBlock] || SEMANTIC_BLOCK_LABELS.other}</span></div><mark>{status[0]}</mark></div>
            <dl><div><dt>Исходный текст</dt><dd>{item.searchText || "Не указан"}</dd></div><div><dt>Новое значение</dt><dd>{item.isEmpty ? "Не заполнено" : String(item.value)}</dd></div><div><dt>Найдено</dt><dd>{item.occurrences} раз</dd></div></dl>
            {item.status === "not_found" && <p>Это значение не найдено в документе. Возможно, Word разбил текст на части или документ был изменён.</p>}
            {item.status === "multiple" && <p>Это значение встречается несколько раз. При скачивании оно будет заменено во всех найденных местах.</p>}
          </article>;
        })}</div>
      </section>}
      {message && <p className={message.startsWith("DOCX сформирован") || message.startsWith("Проверка завершена:") ? "studio-file-ok" : "studio-error"}>{message}</p>}
      <div className="studio-actions"><button className="studio-primary" type="button" onClick={download} disabled={!verification || verification.summary.critical > 0 || verification.invalidValues > 0}><i className="fa-solid fa-download" />Скачать проверенный DOCX</button><Link className="studio-secondary" to={`/template-studio/${template.id}/edit`}>Вернуться к настройке полей</Link></div>
    </section>
  </StudioFrame>;
}
