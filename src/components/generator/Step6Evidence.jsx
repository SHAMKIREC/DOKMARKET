import { useEffect, useState } from "react";
import FileAttachment from "@/components/generator/FileAttachment";
import DatePickerField from "@/components/generator/DatePickerField";

const S = { width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.875rem", outline: "none" };
const TA = { ...S, resize: "vertical" };

const EVIDENCE_BY_TYPE = {
  labor: [
    { value: "Переписка с работодателем или руководителем", desc: "Письма и сообщения о работе, выплатах и требованиях" },
    { value: "Банковские выписки", desc: "Выписки и подтверждения фактических выплат" },
    { value: "Журнал учёта рабочего времени", desc: "Журнал с датами и часами работы" },
    { value: "Табель или график смен", desc: "Табель, график, ведомость или наряды" },
    { value: "Свидетельские показания", desc: "Показания коллег, подтверждающих факт работы" },
    { value: "Трудовой договор", desc: "Подписанный трудовой договор или его копия" },
    { value: "Приказ о приёме или увольнении", desc: "Копия приказа или выписка из него" },
    { value: "Расчётные листки", desc: "Расчётные листки и ведомости начислений" },
    { value: "Скриншоты переписки", desc: "Снимки экрана с датами и участниками переписки" },
    { value: "Пропуск или документы о допуске к работе", desc: "Пропуск, доверенность, служебные документы" },
    { value: "Аудио, фото или иные материалы", desc: "Иные материалы, подтверждающие работу и нарушение" },
  ],
  product: [
    { value: "Чек или квитанция", desc: "Кассовый чек, товарный чек или квитанция" },
    { value: "Договор или заказ", desc: "Договор купли-продажи, заказ или электронная карточка покупки" },
    { value: "Скриншот заказа", desc: "Карточка заказа, товара и статуса доставки" },
    { value: "Фото или видео дефекта", desc: "Материалы, на которых виден недостаток или повреждение" },
    { value: "Переписка с продавцом", desc: "Письма и сообщения по существу проблемы" },
    { value: "Обращение в поддержку", desc: "Номер обращения и ответы службы поддержки" },
    { value: "Отказ продавца", desc: "Письменный отказ или скриншот решения продавца" },
    { value: "Акт диагностики", desc: "Акт проверки качества или диагностики" },
    { value: "Заключение экспертизы", desc: "Заключение специалиста или независимого эксперта" },
    { value: "Гарантийный талон", desc: "Гарантийный талон или сведения о гарантии" },
    { value: "Документы о ремонте", desc: "Заказ-наряд, акт ремонта или квитанция сервиса" },
    { value: "Подтверждение доставки", desc: "Накладная, акт или сведения службы доставки" },
    { value: "Банковская выписка", desc: "Подтверждение оплаты товара и связанных расходов" },
    { value: "Другое", desc: "Иные материалы, подтверждающие покупку и нарушение" },
  ],
  infoproduct: [
    { value: "Переписка с поддержкой", desc: "Скриншоты обращений в поддержку" },
    { value: "Скриншоты курса", desc: "Подтверждение содержимого" },
    { value: "Ответы куратора", desc: "Переписка с куратором" },
    { value: "Договор оферты", desc: "Публичная оферта или договор" },
  ],
  civil: [
    { value: "Расписка / договор займа", desc: "Оригинал расписки или договора" },
    { value: "Переписка с должником", desc: "Скриншоты переписки" },
    { value: "Банковские переводы", desc: "Выписки, подтверждения платежей" },
    { value: "Свидетельские показания", desc: "Показания очевидцев сделки" },
  ],
};

const DEFAULT_EVIDENCE = [
  { value: "Переписка", desc: "Переписка по существу дела" },
  { value: "Документы", desc: "Подтверждающие документы" },
  { value: "Свидетельские показания", desc: "Показания свидетелей" },
];

const NO_EVIDENCE_VALUE = "Нет доказательств";
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SUPPORTED_EXTENSIONS = /\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|webp)$/i;

function normalizeEvidenceFileState(rawFiles) {
  const groups = {};
  if (Array.isArray(rawFiles)) {
    rawFiles.forEach(file => {
      const label = file?.evidenceLabel || file?.evidenceId;
      if (label && file?.name) groups[label] = [...(groups[label] || []), file];
    });
    return groups;
  }
  Object.entries(rawFiles || {}).forEach(([label, value]) => {
    const source = Array.isArray(value) ? value : Array.isArray(value?.files) ? value.files : value?.name ? [value] : [];
    groups[label] = source.filter(file => file?.name).map(file => ({
      ...file,
      evidenceId: file.evidenceId || label,
      evidenceLabel: file.evidenceLabel || label,
    }));
  });
  return groups;
}

function serializeEvidenceFileState(groups) {
  return Object.fromEntries(Object.entries(groups).filter(([, group]) => group?.length).map(([label, group]) => {
    const files = group.map(file => ({ ...file, evidenceId: file.evidenceId || label, evidenceLabel: file.evidenceLabel || label }));
    const representative = files.find(file => !/\.(jpg|jpeg|png|webp)$/i.test(file.name || "")) || files[0];
    return [label, { ...representative, evidenceId: label, evidenceLabel: label, files }];
  }));
}

function compressImageForPdf(file) {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL("image/jpeg", 0.8);
        resolve({ url, width: canvas.width, height: canvas.height, embeddedType: "image/jpeg" });
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(sourceUrl);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("Не удалось обработать изображение"));
    };
    image.src = sourceUrl;
  });
}

export default function Step6Evidence({ claimData, updateClaimData, nextStep, prevStep }) {
  const [selected, setSelected] = useState(claimData.evidence || []);
  const [files, setFiles] = useState(() => normalizeEvidenceFileState(claimData.evidenceFiles || {}));
  const [witness, setWitness] = useState(claimData.witness || { name: "", birthDate: "", text: "", date: "" });
  const [evidenceComment, setEvidenceComment] = useState(claimData.evidenceComment || "");
  const [fileError, setFileError] = useState("");

  const evidenceList = EVIDENCE_BY_TYPE[claimData.type] || DEFAULT_EVIDENCE;
  const hasWitness = selected.includes("Свидетельские показания");
  const hasNoEvidence = selected.includes(NO_EVIDENCE_VALUE);
  const canProceed = claimData.type === "product" || selected.length > 0;

  useEffect(() => {
    updateClaimData({
      evidence: selected,
      evidenceFiles: serializeEvidenceFileState(files),
      evidenceComment,
      witness: selected.includes("Свидетельские показания") ? witness : null,
    });
  }, [evidenceComment, files, selected, updateClaimData, witness]);

  const toggle = (val) => {
    if (val === NO_EVIDENCE_VALUE) {
      // selecting "no evidence" clears everything else
      setSelected(s => s.includes(val) ? [] : [val]);
    } else {
      // selecting any real evidence clears "no evidence"
      setSelected(s => {
        const withoutNo = s.filter(x => x !== NO_EVIDENCE_VALUE);
        return withoutNo.includes(val) ? withoutNo.filter(x => x !== val) : [...withoutNo, val];
      });
    }
  };

  async function handleFile(ev, item) {
    const selectedFiles = Array.from(ev.target.files || []);
    if (!selectedFiles.length) return;
    if (selectedFiles.some(file => !SUPPORTED_EXTENSIONS.test(file.name))) {
      setFileError("Поддерживаются изображения JPG, PNG, WEBP и документы PDF, DOC, DOCX, XLS, XLSX.");
      ev.target.value = "";
      return;
    }
    if (selectedFiles.some(file => file.size > 10 * 1024 * 1024)) {
      setFileError("Размер одного файла не должен превышать 10 МБ.");
      ev.target.value = "";
      return;
    }

    try {
      const preparedFiles = await Promise.all(selectedFiles.map(async file => {
        const imageData = IMAGE_TYPES.has(file.type) || /\.(jpg|jpeg|png|webp)$/i.test(file.name)
          ? await compressImageForPdf(file)
          : { url: null, width: null, height: null, embeddedType: null };
        return {
          id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          evidenceId: item,
          evidenceLabel: item,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          ...imageData,
        };
      }));
      setFiles(current => ({
        ...current,
        [item]: [...(current[item] || []), ...preparedFiles],
      }));
      setFileError("");
    } catch {
      console.error("Не удалось подготовить изображение для PDF.");
      setFileError("Не удалось обработать изображение. Попробуйте другой файл.");
    } finally {
      ev.target.value = "";
    }
  }

  function removeFile(item, fileId, fileIndex) {
    setFiles(f => {
      const next = { ...f };
      const remaining = (next[item] || []).filter((file, index) => file.id ? file.id !== fileId : index !== fileIndex);
      if (remaining.length) next[item] = remaining;
      else delete next[item];
      return next;
    });
  }

  function viewFile(file) {
    if (file.url) {
      window.open(file.url, "_blank");
    }
  }

  function save() {
    updateClaimData({
      evidence: selected,
      evidenceFiles: serializeEvidenceFileState(files),
      evidenceComment: evidenceComment.trim(),
      witness: hasWitness ? witness : null
    });
    nextStep();
  }

  return (
    <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)", padding: "clamp(16px,5vw,32px)" }}>
      <h3 className="text-xl font-bold text-white mb-2">Доказательства</h3>
      <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: 6 }}>Отметьте доказательства, которые у вас есть. Файлы автоматически попадут в раздел «Приложения».</p>
      {claimData.type === "labor" && (
        <div style={{ marginBottom: 20, padding: "11px 13px", borderRadius: 10, background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.16)" }}>
          <p style={{ color: "#cbd5e1", fontSize: "0.8rem", margin: "0 0 3px" }}>Загруженные изображения будут добавлены в конец PDF как приложения. Другие файлы будут указаны в списке приложений.</p>
          <p style={{ color: "#64748b", fontSize: "0.74rem", margin: 0 }}>Лучше загружать JPG/PNG-скриншоты. Для онлайн-отправки итоговый PDF желательно держать до 5 МБ.</p>
        </div>
      )}
      {fileError && <p style={{ color: "#fbbf24", fontSize: "0.78rem", marginBottom: 16 }}>{fileError}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {evidenceList.map(ev => {
          const checked = selected.includes(ev.value);
          const disabled = hasNoEvidence && ev.value !== NO_EVIDENCE_VALUE;
          const evidenceFiles = files[ev.value] || [];
          return (
            <div key={ev.value} style={{ borderRadius: 12, border: `1px solid ${checked ? "#0ea5e9" : "rgba(255,255,255,0.1)"}`, background: checked ? "rgba(14,165,233,0.06)" : "transparent", overflow: "hidden", opacity: disabled ? 0.4 : 1 }}>
              <label onClick={() => !disabled && toggle(ev.value)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", cursor: disabled ? "not-allowed" : "pointer" }}>
                <input type="checkbox" checked={checked} onChange={() => {}} style={{ marginTop: 2, width: 18, height: 18, accentColor: "#0ea5e9", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ display: "block", fontWeight: 500, color: "white", fontSize: "0.9rem" }}>{ev.value}</span>
                  <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{ev.desc}</span>
                </div>
              </label>
              {checked && !disabled && (
                <div style={{ borderTop: "1px solid rgba(14,165,233,0.15)", padding: "10px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ color: "#cbd5e1", fontSize: "0.76rem", fontWeight: 600, margin: 0 }}>Добавить файлы к этому доказательству</p>
                  {evidenceFiles.map((file, fileIndex) => (
                    <FileAttachment
                      key={file.id || `${file.name}-${fileIndex}`}
                      file={file}
                      evidenceLabel={ev.value}
                      onView={viewFile}
                      onDelete={() => removeFile(ev.value, file.id, fileIndex)}
                    />
                  ))}
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(14,165,233,0.15)", color: "#22d3ee", border: "1px solid rgba(14,165,233,0.3)", borderRadius: 8, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, alignSelf: "flex-start" }}>
                    <i className="fa-solid fa-plus"></i> {evidenceFiles.length ? "Добавить ещё файлы" : "Выбрать файлы"}
                    <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={e => handleFile(e, ev.value)} />
                  </label>
                  <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>JPG, PNG, WEBP, PDF, DOCX, XLSX · каждый файл до 10 МБ</span>
                </div>
              )}
            </div>
          );
        })}

        {/* "No evidence" option */}
        <div style={{ borderRadius: 12, border: `1px solid ${hasNoEvidence ? "#f59e0b" : "rgba(255,255,255,0.1)"}`, background: hasNoEvidence ? "rgba(245,158,11,0.07)" : "transparent" }}>
          <label onClick={() => toggle(NO_EVIDENCE_VALUE)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
            <input type="checkbox" checked={hasNoEvidence} onChange={() => {}} style={{ marginTop: 2, width: 18, height: 18, accentColor: "#f59e0b", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ display: "block", fontWeight: 500, color: hasNoEvidence ? "#fbbf24" : "white", fontSize: "0.9rem" }}>Нет доказательств</span>
              <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Претензия будет составлена на основе ваших данных без вложений</span>
            </div>
          </label>
        </div>
      </div>

      {!selected.length && (
        <p style={{ color: "#f59e0b", fontSize: "0.8rem", marginBottom: 14 }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }}></i>
          {claimData.type === "product"
            ? "Доказательства не выбраны. Рекомендуем приложить хотя бы чек, фото недостатка или переписку с продавцом."
            : "Выберите хотя бы один пункт или отметьте «Нет доказательств»"}
        </p>
      )}

      {hasWitness && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <h4 style={{ fontWeight: 600, color: "white", marginBottom: 14 }}>Данные свидетеля</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input style={S} value={witness.name} onChange={e => setWitness(w => ({ ...w, name: e.target.value }))} placeholder="ФИО свидетеля" />
            <DatePickerField value={witness.birthDate} onChange={value => setWitness(w => ({ ...w, birthDate: value }))} />
            <textarea style={TA} rows={3} value={witness.text} onChange={e => setWitness(w => ({ ...w, text: e.target.value }))} placeholder="Текст подтверждения свидетеля..." maxLength={1000} />
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 14px" }}>
              <p style={{ color: "#9ca3af", fontSize: "0.78rem" }}>
                <i className="fa-solid fa-pen-line" style={{ marginRight: 6, color: "#0ea5e9" }}></i>
                В PDF будет предусмотрено место для подписи свидетеля
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", color: "#d1d5db", fontSize: ".82rem", fontWeight: 500, marginBottom: 6 }}>Комментарий к доказательствам <span style={{ color: "#6b7280", fontWeight: 400 }}>(необязательно)</span></label>
        <textarea style={TA} rows={3} value={evidenceComment} onChange={e => setEvidenceComment(e.target.value)} placeholder="Укажите, что подтверждают материалы, или перечислите иные доказательства" maxLength={1500} />
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={prevStep} style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 600 }}>Назад</button>
        <button onClick={save} disabled={!canProceed}
          style={{ flex: 2, minWidth: 140, padding: "12px", borderRadius: 12, background: canProceed ? "linear-gradient(135deg,#0ea5e9,#8b5cf6)" : "rgba(255,255,255,0.1)", border: "none", color: canProceed ? "white" : "#6b7280", cursor: canProceed ? "pointer" : "not-allowed", fontWeight: 600 }}>
          Далее
        </button>
      </div>
    </div>
  );
}
