import { useState } from "react";
import { createFieldsFromPlaceholders, detectDocumentStructure, extractPlaceholdersFromDocx, extractPlainTextFromDocx } from "../services/docxPlaceholderService";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function TemplateUploader({ onProcessed, disabled = false }) {
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function selectFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("Можно загрузить только файл DOCX.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Размер DOCX не должен превышать 2 МБ.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const placeholders = extractPlaceholdersFromDocx(arrayBuffer);
      const placeholderFields = createFieldsFromPlaceholders(placeholders);
      const plainText = extractPlainTextFromDocx(arrayBuffer);
      const structure = detectDocumentStructure(plainText);
      const candidates = structure.fields.map((field, index) => ({ ...field, order: placeholderFields.length + index }));
      const fields = [...placeholderFields, ...candidates];
      if (!placeholders.length) setNotice(candidates.length
        ? `Технические метки не найдены. Это нормально: система предложила переменные данные автоматически.`
        : "Мы не нашли данные автоматически. После загрузки добавьте поля вручную: укажите текст из документа, который нужно заменить при заполнении.");
      setFileName(file.name);
      onProcessed?.({
        file,
        arrayBuffer,
        fields,
        placeholderCount: placeholderFields.length,
        candidateCount: candidates.length,
        plainText,
        documentType: structure.documentType,
        blocks: structure.blocks,
        mimeType: file.type || DOCX_MIME,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось прочитать DOCX.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="studio-uploader">
    <input id="studio-docx-upload" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={selectFile} disabled={disabled || loading} hidden />
    <label htmlFor="studio-docx-upload" className={`studio-upload-button ${disabled || loading ? "disabled" : ""}`}>
      <i className="fa-solid fa-cloud-arrow-up" />
      <span><strong>{loading ? "Читаем документ…" : "Выбрать DOCX"}</strong><small>До 2 МБ</small></span>
    </label>
    {fileName && <p className="studio-file-ok"><i className="fa-solid fa-circle-check" />{fileName}</p>}
    {notice && <p className="studio-notice">{notice}</p>}
    <p className="studio-technical-hint">Если в документе уже есть технические метки вида {"{{field.name}}"}, конструктор тоже их распознает.</p>
    {error && <p className="studio-error" role="alert">{error}</p>}
  </div>;
}
