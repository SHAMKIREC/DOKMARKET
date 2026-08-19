import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { categories, directions, sections, situations } from "@/data/marketplaceMock";
import {
  getSpecialistMaterial,
  getSpecialistMaterialFile,
  saveReadyFileMaterial,
} from "@/specialist-materials/services/specialistMaterialStorageService";
import { MaterialFrame } from "./SpecialistMaterials";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["docx", "pdf"]);
const MIME_TYPES = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

function arrayBufferToBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

const EMPTY_FORM = {
  title: "",
  description: "",
  directionSlug: "",
  sectionSlug: "",
  categorySlug: "",
  situationSlug: "",
  price: "",
  isFree: true,
  whatIncluded: "",
  suitableFor: "",
  fillInstructions: "",
};

export default function SpecialistMaterialNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const existing = editId ? getSpecialistMaterial(editId, user?.id) : null;
  const existingFile = existing ? getSpecialistMaterialFile(existing.id, user?.id) : null;
  const [mode, setMode] = useState(existing ? "ready_file" : "");
  const [form, setForm] = useState(() => existing ? {
    ...EMPTY_FORM,
    ...existing,
    price: existing.price ? String(existing.price) : "",
  } : EMPTY_FORM);
  const [file, setFile] = useState(() => existingFile ? {
    name: existing.fileName,
    mimeType: existing.fileMimeType,
    size: existing.fileSize,
    base64: existingFile.base64,
  } : null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const availableSections = useMemo(() => sections.filter(item => item.directionSlug === form.directionSlug), [form.directionSlug]);
  const availableCategories = useMemo(() => categories.filter(item => item.directionSlug === form.directionSlug && item.sectionSlug === form.sectionSlug), [form.directionSlug, form.sectionSlug]);
  const availableSituations = useMemo(() => situations.filter(item => item.directionSlug === form.directionSlug && item.sectionSlug === form.sectionSlug && item.categorySlug === form.categorySlug), [form.directionSlug, form.sectionSlug, form.categorySlug]);

  function update(key, value) {
    setForm(current => {
      const next = { ...current, [key]: value };
      if (key === "directionSlug") Object.assign(next, { sectionSlug: "", categorySlug: "", situationSlug: "" });
      if (key === "sectionSlug") Object.assign(next, { categorySlug: "", situationSlug: "" });
      if (key === "categorySlug") next.situationSlug = "";
      return next;
    });
    setError("");
  }

  async function selectFile(event) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) return setError("Можно загрузить только DOCX или PDF.");
    if (selected.size > MAX_FILE_SIZE) return setError("Размер файла не должен превышать 5 МБ.");
    try {
      setFile({
        name: selected.name,
        mimeType: selected.type || MIME_TYPES[extension],
        size: selected.size,
        base64: arrayBufferToBase64(await selected.arrayBuffer()),
      });
      setError("");
    } catch {
      setError("Не удалось прочитать файл.");
    }
  }

  function choose(nextMode) {
    if (nextMode === "online_form") return navigate("/template-studio/new");
    setMode(nextMode);
    setNotice(nextMode === "ready_file" ? "" : "Этот тип материала будет подключён следующим этапом. Сейчас полностью доступна загрузка готового файла.");
  }

  function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return setError("Укажите название и краткое описание.");
    if (!form.directionSlug) return setError("Выберите направление.");
    if (!file) return setError("Загрузите DOCX или PDF.");
    if (!form.isFree && (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0)) return setError("Укажите цену материала.");
    setSaving(true);
    try {
      saveReadyFileMaterial({
        ownerId: user.id,
        material: {
          ...form,
          id: existing?.id,
          title: form.title.trim(),
          description: form.description.trim(),
          whatIncluded: form.whatIncluded.trim(),
          suitableFor: form.suitableFor.trim(),
          fillInstructions: form.fillInstructions.trim(),
        },
        file,
      });
      navigate("/specialist/materials", { replace: true });
    } catch {
      setError("Не удалось сохранить материал. LocalStorage может быть переполнен — попробуйте файл меньшего размера.");
      setSaving(false);
    }
  }

  return <MaterialFrame>
    <header className="material-head"><div><span className="material-kicker">Материалы специалиста</span><h1 className="material-title">{existing ? "Редактировать материал" : "Что вы хотите разместить?"}</h1><p className="material-copy">Не каждый документ нужно превращать в онлайн-форму. Готовый файл можно сохранить отдельным черновиком для будущей публикации.</p></div><Link className="material-secondary" to="/specialist/materials">Мои материалы</Link></header>
    {!existing && <section className="material-choice-grid">
      <button type="button" className={`material-choice ${mode === "ready_file" ? "active" : ""}`} onClick={() => choose("ready_file")}><i className="fa-regular fa-file-arrow-down" /><h2>Готовый файл</h2><p>Загрузите DOCX или PDF. Пользователь сможет скачать файл и заполнить его самостоятельно.</p><b>Загрузить файл →</b></button>
      <button type="button" className="material-choice" onClick={() => choose("online_form")}><i className="fa-solid fa-wand-magic-sparkles" /><h2>Онлайн-форма</h2><p>Загрузите DOCX и превратите его в форму для заполнения.</p><b>Открыть конструктор →</b></button>
      <button type="button" className="material-choice" onClick={() => choose("service")}><i className="fa-solid fa-user-tie" /><h2>Услуга специалиста</h2><p>Опишите услугу, цену и срок выполнения.</p><b>Добавить услугу →</b></button>
      <button type="button" className="material-choice" onClick={() => choose("guide")}><i className="fa-regular fa-rectangle-list" /><h2>Инструкция / чек-лист</h2><p>Добавьте пошаговый материал или сопровождающий файл.</p><b>Добавить инструкцию →</b></button>
    </section>}
    {notice && <p className="material-notice">{notice}</p>}
    {mode === "ready_file" && <form className="material-form-panel material-glass" onSubmit={submit}>
      <div className="material-form">
        <label className="material-field"><span>Название материала</span><input value={form.title} onChange={event => update("title", event.target.value)} placeholder="Например, договор аренды квартиры" /></label>
        <label className="material-field"><span>Краткое описание</span><input value={form.description} onChange={event => update("description", event.target.value)} placeholder="Что это за документ и какую задачу решает" /></label>
        <label className="material-field"><span>Направление</span><select value={form.directionSlug} onChange={event => update("directionSlug", event.target.value)}><option value="">Выберите направление</option>{directions.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select></label>
        <label className="material-field"><span>Раздел</span><select value={form.sectionSlug} onChange={event => update("sectionSlug", event.target.value)} disabled={!availableSections.length}><option value="">{availableSections.length ? "Выберите раздел" : "Разделы пока не настроены"}</option>{availableSections.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select></label>
        <label className="material-field"><span>Категория</span><select value={form.categorySlug} onChange={event => update("categorySlug", event.target.value)} disabled={!availableCategories.length}><option value="">{availableCategories.length ? "Выберите категорию" : "Категории пока не настроены"}</option>{availableCategories.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select></label>
        <label className="material-field"><span>Ситуация</span><select value={form.situationSlug} onChange={event => update("situationSlug", event.target.value)} disabled={!availableSituations.length}><option value="">{availableSituations.length ? "Выберите ситуацию" : "Ситуации пока не настроены"}</option>{availableSituations.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select></label>
        <label className="material-field wide material-file"><span>Файл DOCX или PDF</span><input type="file" accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={selectFile} /><small>{file ? `${file.name} · ${(file.size / 1024).toFixed(0)} КБ` : "До 5 МБ"}</small></label>
        <label className="material-check wide"><input type="checkbox" checked={form.isFree} onChange={event => update("isFree", event.target.checked)} />Материал бесплатный</label>
        {!form.isFree && <label className="material-field"><span>Цена, ₽</span><input type="number" min="1" step="1" value={form.price} onChange={event => update("price", event.target.value)} /></label>}
        <label className="material-field wide"><span>Что получит пользователь</span><textarea rows="3" value={form.whatIncluded} onChange={event => update("whatIncluded", event.target.value)} placeholder="Состав файла и дополнительные материалы" /></label>
        <label className="material-field wide"><span>Для кого подходит</span><textarea rows="3" value={form.suitableFor} onChange={event => update("suitableFor", event.target.value)} placeholder="Кому и в каких ситуациях пригодится материал" /></label>
        <label className="material-field wide"><span>Инструкция по заполнению</span><textarea rows="4" value={form.fillInstructions} onChange={event => update("fillInstructions", event.target.value)} placeholder="Какие данные пользователь должен заменить или дополнить" /></label>
      </div>
      <p className="material-notice">Статус после сохранения: черновик. В production файлы должны храниться на сервере или в объектном хранилище. LocalStorage используется только для MVP.</p>
      {error && <p className="material-error">{error}</p>}
      <div className="material-actions"><button className="material-primary" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить черновик"}</button><Link className="material-secondary" to="/specialist/materials">Отмена</Link></div>
    </form>}
  </MaterialFrame>;
}
