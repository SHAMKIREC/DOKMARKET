import { useEffect, useMemo, useState } from "react";
import FileAttachment from "@/components/generator/FileAttachment";
import { deleteEvidenceFile, getEvidenceFileUrl, uploadEvidenceFile } from "@/services/evidenceStorageService";

const NO_EVIDENCE_VALUE = "Нет доказательств";
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SUPPORTED_EXTENSIONS = /\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|webp)$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const LISTS = {
  labor: [
    ["Трудовой договор", "Подписанный договор или его копия"],
    ["Приказ о приёме или увольнении", "Копия приказа или выписка"],
    ["Расчётные листки", "Начисления и удержания"],
    ["Банковские выписки", "Фактические выплаты работодателя"],
    ["Табель или график смен", "Рабочее время, смены, наряды"],
    ["Переписка с работодателем или руководителем", "Сообщения о работе, выплатах и требованиях"],
    ["Скриншоты переписки", "Снимки экрана с датами и участниками"],
    ["Пропуск или документы о допуске к работе", "Подтверждение фактической работы"],
    ["Свидетельские показания", "Коллега или другое лицо подтверждает обстоятельства"],
    ["Аудио, фото или иные материалы", "Иные относимые материалы"],
  ],
  product: [
    ["Чек или квитанция", "Подтверждение покупки"],
    ["Договор или заказ", "Договор, заказ или карточка покупки"],
    ["Скриншот заказа", "Товар, цена, продавец, доставка"],
    ["Фото или видео дефекта", "Материалы с недостатком товара"],
    ["Переписка с продавцом", "Обращения и ответы продавца"],
    ["Отказ продавца", "Письменный отказ или решение по обращению"],
    ["Акт диагностики", "Проверка качества или диагностика"],
    ["Заключение экспертизы", "Заключение специалиста или эксперта"],
    ["Гарантийный талон", "Сведения о гарантии"],
    ["Документы о ремонте", "Заказ-наряд, акт или квитанция"],
    ["Подтверждение доставки", "Накладная, акт, сведения перевозчика"],
    ["Банковская выписка", "Оплата и связанные расходы"],
    ["Другое", "Иные материалы по покупке и недостатку"],
  ],
  course: [
    ["Договор или публичная оферта", "Условия оказания услуг на дату покупки"],
    ["Чек или подтверждение оплаты", "Чек, выписка, платёжное поручение"],
    ["Рекламные материалы и обещания", "Лендинг, презентация, вебинар, сообщения"],
    ["Скриншоты личного кабинета курса", "Модули, сроки и фактически предоставленный доступ"],
    ["Переписка с поддержкой", "Обращения о возврате, доступе или качестве"],
    ["Переписка с куратором", "Обещанная или отсутствующая обратная связь"],
    ["Заявление на возврат", "Ранее направленное требование"],
    ["Ответ онлайн-школы", "Отказ, расчёт удержаний или иной ответ"],
    ["Кредитный договор или рассрочка", "Если обучение оплачено заёмными средствами"],
    ["Другое", "Иные материалы по спору"],
  ],
  debt: [
    ["Расписка", "Расписка о получении денег"],
    ["Договор займа", "Договор займа и приложения"],
    ["Договор или иной документ об обязательстве", "Документ, из которого возник долг"],
    ["Банковские переводы", "Подтверждение передачи денег"],
    ["Подтверждение частичного возврата", "Переводы или расписки о погашении"],
    ["Переписка с должником", "Признание долга, суммы или срока"],
    ["Ранее направленное требование", "Претензия, письмо или сообщение"],
    ["Подтверждение получения требования", "Почтовое или электронное подтверждение"],
    ["Свидетельские показания", "Лица, знающие обстоятельства обязательства"],
    ["Другое", "Иные материалы о наличии и размере долга"],
  ],
};
LISTS.infoproduct = LISTS.course;
LISTS.civil = LISTS.debt;

const TIPS = {
  labor: "Особенно полезны документы о фактической работе, начислениях и выплатах.",
  product: "Желательно приложить подтверждение покупки и материалы, показывающие недостаток.",
  course: "Сохраняйте оферту и рекламу на дату покупки: условия на сайте могут измениться.",
  infoproduct: "Сохраняйте оферту и рекламу на дату покупки: условия на сайте могут измениться.",
  debt: "Особенно важны документы о передаче денег и признании долга.",
  civil: "Особенно важны документы о передаче денег и признании долга.",
};

const inputStyle = { width: "100%", padding: "11px 13px", borderRadius: 10, background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.1)", color: "white", outline: "none" };

function normalizeGroups(raw) {
  const out = {};
  Object.entries(raw || {}).forEach(([label, value]) => {
    const source = Array.isArray(value) ? value : Array.isArray(value?.files) ? value.files : value?.name ? [value] : [];
    if (source.length) out[label] = source.map(file => ({ ...file, evidenceId: file.evidenceId || label, evidenceLabel: file.evidenceLabel || label }));
  });
  return out;
}

function serializeGroups(groups) {
  return Object.fromEntries(Object.entries(groups).filter(([, values]) => values?.length).map(([label, values]) => {
    const files = values.map(file => ({
      id: file.id,
      evidenceId: label,
      evidenceLabel: label,
      name: file.name,
      size: file.size,
      type: file.type,
      storageBucket: file.storageBucket,
      storagePath: file.storagePath,
      storageKey: file.storageKey,
      url: file.url || null,
      width: file.width || null,
      height: file.height || null,
      embeddedType: file.embeddedType || null,
    }));
    return [label, { ...files[0], files }];
  }));
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({ url: canvas.toDataURL("image/jpeg", .8), width: canvas.width, height: canvas.height, embeddedType: "image/jpeg" });
      } catch (error) { reject(error); }
      finally { URL.revokeObjectURL(src); }
    };
    image.onerror = () => { URL.revokeObjectURL(src); reject(new Error("IMAGE_READ_FAILED")); };
    image.src = src;
  });
}

export default function Step6Evidence({ claimData, updateClaimData, nextStep, prevStep }) {
  const [selected, setSelected] = useState(Array.isArray(claimData.evidence) ? claimData.evidence : []);
  const [files, setFiles] = useState(() => normalizeGroups(claimData.evidenceFiles));
  const [witness, setWitness] = useState(claimData.witness || { name: "", birthDate: "", text: "", date: "" });
  const [comment, setComment] = useState(claimData.evidenceComment || "");
  const [busyLabel, setBusyLabel] = useState("");
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const list = useMemo(() => (LISTS[claimData.type] || [["Документы", "Подтверждающие документы"], ["Переписка", "Переписка по существу дела"], ["Свидетельские показания", "Показания свидетеля"]]).map(([value, desc]) => ({ value, desc })), [claimData.type]);
  const noEvidence = selected.includes(NO_EVIDENCE_VALUE);
  const hasWitness = selected.includes("Свидетельские показания");

  useEffect(() => {
    updateClaimData({ evidence: selected, evidenceFiles: serializeGroups(files), evidenceComment: comment, witness: hasWitness ? witness : null });
  }, [selected, files, comment, witness, hasWitness, updateClaimData]);

  function toggle(value) {
    setFormError("");
    if (value === NO_EVIDENCE_VALUE) {
      setSelected(current => current.includes(value) ? [] : [value]);
      return;
    }
    setSelected(current => {
      const clean = current.filter(item => item !== NO_EVIDENCE_VALUE);
      return clean.includes(value) ? clean.filter(item => item !== value) : [...clean, value];
    });
  }

  async function handleFiles(event, label) {
    const inputFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (!inputFiles.length) return;
    if (inputFiles.some(file => !SUPPORTED_EXTENSIONS.test(file.name))) {
      setFileError("Поддерживаются JPG, PNG, WEBP, PDF, DOC, DOCX, XLS и XLSX.");
      return;
    }
    if (inputFiles.some(file => file.size > MAX_FILE_SIZE)) {
      setFileError("Размер одного файла не должен превышать 10 МБ.");
      return;
    }

    setBusyLabel(label);
    setFileError("");
    const prepared = [];
    try {
      for (const file of inputFiles) {
        let cloud = {};
        try {
          cloud = await uploadEvidenceFile(file, claimData);
        } catch (error) {
          if (error?.message !== "AUTH_REQUIRED") throw error;
          setFileError("Файл добавлен локально. Чтобы он сохранился между устройствами, войдите в аккаунт.");
        }
        const imageData = IMAGE_TYPES.has(file.type) || /\.(jpg|jpeg|png|webp)$/i.test(file.name) ? await compressImage(file) : {};
        prepared.push({
          id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          evidenceId: label,
          evidenceLabel: label,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          ...cloud,
          ...imageData,
        });
      }
      setFiles(current => ({ ...current, [label]: [...(current[label] || []), ...prepared] }));
    } catch (error) {
      console.error(error);
      setFileError("Не удалось сохранить файл на сервере. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setBusyLabel("");
    }
  }

  async function viewFile(file) {
    try {
      if (file.url) {
        window.open(file.url, "_blank", "noopener,noreferrer");
        return;
      }
      const url = await getEvidenceFileUrl(file, claimData);
      if (!url) throw new Error("SIGNED_URL_FAILED");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setFileError("Не удалось открыть файл. Обновите страницу и попробуйте ещё раз.");
    }
  }

  async function removeFile(label, file, index) {
    try {
      if (file.storagePath) await deleteEvidenceFile(file, claimData);
      setFiles(current => {
        const next = { ...current };
        const remaining = (next[label] || []).filter((candidate, candidateIndex) => candidate.id ? candidate.id !== file.id : candidateIndex !== index);
        if (remaining.length) next[label] = remaining;
        else delete next[label];
        return next;
      });
      setFileError("");
    } catch {
      setFileError("Не удалось удалить файл с сервера.");
    }
  }

  function save() {
    if (!selected.length) {
      setFormError("Выберите хотя бы один вид доказательства или отметьте «Нет доказательств».");
      return;
    }
    if (hasWitness && (String(witness.name || "").trim().length < 5 || String(witness.text || "").trim().length < 20)) {
      setFormError("Для свидетеля укажите ФИО и что именно он может подтвердить.");
      return;
    }
    setFormError("");
    updateClaimData({ evidence: selected, evidenceFiles: serializeGroups(files), evidenceComment: comment.trim(), witness: hasWitness ? { ...witness, name: witness.name.trim(), text: witness.text.trim() } : null });
    nextStep();
  }

  return <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,.03)", padding: "clamp(16px,5vw,32px)" }}>
    <h3 style={{ color: "white", fontWeight: 800, fontSize: "1.3rem", margin: "0 0 7px" }}>Доказательства</h3>
    <p style={{ color: "#94a3b8", fontSize: ".85rem", lineHeight: 1.6, margin: "0 0 8px" }}>Отметьте только то, что действительно есть. Загруженные файлы сохраняются в закрытом хранилище и не являются публичными.</p>
    <div style={{ padding: "11px 13px", borderRadius: 11, background: "rgba(14,165,233,.06)", border: "1px solid rgba(14,165,233,.16)", marginBottom: 18 }}><p style={{ color: "#cbd5e1", fontSize: ".78rem", lineHeight: 1.55, margin: 0 }}>{TIPS[claimData.type] || "Выбирайте материалы, которые сможете приложить к претензии."}</p></div>
    {fileError && <p role="status" style={{ color: "#fbbf24", fontSize: ".78rem", margin: "0 0 14px" }}>{fileError}</p>}
    {formError && <p role="alert" style={{ color: "#fda4af", fontSize: ".8rem", padding: "10px 12px", borderRadius: 10, background: "rgba(244,63,94,.08)", border: "1px solid rgba(244,63,94,.25)", margin: "0 0 14px" }}>{formError}</p>}

    <div style={{ display: "grid", gap: 10 }}>
      {list.map(item => {
        const checked = selected.includes(item.value);
        const disabled = noEvidence;
        const group = files[item.value] || [];
        return <div key={item.value} style={{ borderRadius: 12, border: `1px solid ${checked ? "#0ea5e9" : "rgba(255,255,255,.1)"}`, background: checked ? "rgba(14,165,233,.06)" : "transparent", opacity: disabled ? .45 : 1 }}>
          <label style={{ display: "flex", gap: 12, padding: "14px 16px", cursor: disabled ? "not-allowed" : "pointer" }}>
            <input type="checkbox" disabled={disabled} checked={checked} onChange={() => toggle(item.value)} style={{ width: 18, height: 18, marginTop: 2, accentColor: "#0ea5e9" }} />
            <span><b style={{ display: "block", color: "white", fontSize: ".88rem" }}>{item.value}</b><small style={{ color: "#94a3b8", fontSize: ".75rem" }}>{item.desc}</small></span>
          </label>
          {checked && !disabled && <div style={{ borderTop: "1px solid rgba(14,165,233,.15)", padding: "10px 16px", display: "grid", gap: 8 }}>
            {group.map((file, index) => <FileAttachment key={file.id || `${file.name}-${index}`} file={file} evidenceLabel={item.value} onView={viewFile} onDelete={target => removeFile(item.value, target, index)} />)}
            <label style={{ display: "inline-flex", alignItems: "center", gap: 7, justifySelf: "start", padding: "7px 12px", borderRadius: 8, background: "rgba(14,165,233,.14)", border: "1px solid rgba(14,165,233,.3)", color: "#22d3ee", fontSize: ".78rem", fontWeight: 700, cursor: busyLabel ? "wait" : "pointer" }}><i className={`fa-solid ${busyLabel === item.value ? "fa-spinner fa-spin" : "fa-plus"}`} />{busyLabel === item.value ? "Сохраняем…" : group.length ? "Добавить ещё" : "Выбрать файлы"}<input type="file" multiple disabled={Boolean(busyLabel)} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={event => handleFiles(event, item.value)} /></label>
            <small style={{ color: "#64748b", fontSize: ".69rem" }}>JPG, PNG, WEBP, PDF, DOCX, XLSX · до 10 МБ на файл</small>
          </div>}
        </div>;
      })}

      <label style={{ display: "flex", gap: 12, padding: "14px 16px", borderRadius: 12, border: `1px solid ${noEvidence ? "#f59e0b" : "rgba(255,255,255,.1)"}`, background: noEvidence ? "rgba(245,158,11,.07)" : "transparent", cursor: "pointer" }}><input type="checkbox" checked={noEvidence} onChange={() => toggle(NO_EVIDENCE_VALUE)} style={{ width: 18, height: 18, marginTop: 2, accentColor: "#f59e0b" }} /><span><b style={{ display: "block", color: noEvidence ? "#fbbf24" : "white", fontSize: ".88rem" }}>Нет доказательств</b><small style={{ color: "#94a3b8", fontSize: ".75rem" }}>Документ можно подготовить и без приложений, но доказательственная позиция может быть слабее.</small></span></label>
    </div>

    {hasWitness && <div style={{ marginTop: 18, padding: 16, borderRadius: 12, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.1)", display: "grid", gap: 10 }}><h4 style={{ color: "white", margin: 0, fontWeight: 750 }}>Данные свидетеля</h4><input style={inputStyle} value={witness.name || ""} onChange={e => setWitness(current => ({ ...current, name: e.target.value }))} placeholder="ФИО свидетеля" /><input style={inputStyle} type="date" value={witness.birthDate || ""} onChange={e => setWitness(current => ({ ...current, birthDate: e.target.value }))} /><textarea style={{ ...inputStyle, minHeight: 95, resize: "vertical" }} value={witness.text || ""} onChange={e => setWitness(current => ({ ...current, text: e.target.value }))} placeholder="Что именно свидетель может подтвердить" /></div>}

    <div style={{ marginTop: 18 }}><label style={{ color: "#cbd5e1", fontSize: ".78rem", display: "grid", gap: 6 }}>Комментарий к доказательствам<textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={comment} onChange={e => setComment(e.target.value)} placeholder="Необязательное пояснение к приложениям" /></label></div>

    <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}><button type="button" onClick={prevStep} style={{ flex: 1, minWidth: 120, padding: 12, borderRadius: 11, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", color: "white", fontWeight: 700, cursor: "pointer" }}>Назад</button><button type="button" onClick={save} disabled={Boolean(busyLabel)} style={{ flex: 2, minWidth: 180, padding: 12, borderRadius: 11, border: 0, background: "linear-gradient(135deg,#0891b2,#7c3aed)", color: "white", fontWeight: 800, cursor: busyLabel ? "wait" : "pointer", opacity: busyLabel ? .65 : 1 }}>{busyLabel ? "Сохраняем файлы…" : "Далее"}</button></div>
  </div>;
}
