import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DetectedFields from "@/template-studio/components/DetectedFields";
import TemplateUploader from "@/template-studio/components/TemplateUploader";
import { arrayBufferToBase64 } from "@/template-studio/services/docxPlaceholderService";
import { createTemplate } from "@/template-studio/services/templateStorageService";
import { StudioFrame, StudioNavigation } from "./TemplateStudio";

export default function TemplateStudioNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [upload, setUpload] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function submit(event) {
    event.preventDefault();
    if (!title.trim()) return setError("Укажите название шаблона.");
    if (!upload) return setError("Загрузите DOCX.");
    setSaving(true);
    setError("");
    try {
      const template = createTemplate({
        title,
        description,
        sourceFileName: upload.file.name,
        sourceMimeType: upload.mimeType,
        sourceSize: upload.file.size,
        sourceBase64: arrayBufferToBase64(upload.arrayBuffer),
        fields: upload.fields,
        documentType: upload.documentType,
        blocks: upload.blocks,
      });
      navigate(`/template-studio/${template.id}/edit`, { replace: true });
    } catch {
      setError("Не удалось сохранить шаблон. Возможно, в localStorage недостаточно места.");
      setSaving(false);
    }
  }

  return <StudioFrame>
    <StudioNavigation />
    <header style={{ marginBottom: 20 }}><span className="studio-kicker">Новый шаблон</span><h1 className="studio-title">Загрузите документ</h1><p className="studio-subtitle">Загрузите обычный DOCX. После загрузки система предложит данные, которые можно превратить в поля.</p></header>
    <form className="studio-panel studio-glass" onSubmit={submit}>
      <div className="studio-form-grid">
        <label className="studio-label"><span>Название шаблона</span><input value={title} onChange={event => setTitle(event.target.value)} placeholder="Например, договор оказания услуг" /></label>
        <label className="studio-label"><span>Описание</span><input value={description} onChange={event => setDescription(event.target.value)} placeholder="Коротко о назначении документа" /></label>
      </div>
      <TemplateUploader onProcessed={setUpload} disabled={saving} />
      <DetectedFields fields={upload?.fields} documentType={upload?.documentType} blocks={upload?.blocks} />
      {error && <p className="studio-error" role="alert">{error}</p>}
      <div className="studio-actions"><button className="studio-primary" disabled={saving}>{saving ? "Сохраняем…" : "Создать и настроить поля"}</button></div>
    </form>
  </StudioFrame>;
}
