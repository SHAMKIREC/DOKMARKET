import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { deleteDocument, listDocuments, updateDocument } from "@/services/documentService";
import { buildDocxBlob, generatePDF } from "@/components/generator/pdfGenerator";

const categories = {
  labor: { title: "Трудовой спор", description: "Зарплата, увольнение, расчёт, работа без договора.", icon: "fa-briefcase", responseDays: 10 },
  product: { title: "Некачественный товар", description: "Брак, возврат денег, гарантия, магазин или маркетплейс.", icon: "fa-box-open", responseDays: 10 },
  course: { title: "Онлайн-курс / инфопродукт", description: "Нет доступа, отказ в возврате, плохое обучение, куратор не отвечает.", icon: "fa-graduation-cap", responseDays: 10 },
  infoproduct: { title: "Онлайн-курс / инфопродукт", description: "Нет доступа, отказ в возврате, плохое обучение, куратор не отвечает.", icon: "fa-graduation-cap", responseDays: 10 },
  debt: { title: "Гражданский спор / долг", description: "Расписка, займ, аренда, ЖКХ, банк, туризм, услуги или договор.", icon: "fa-file-invoice-dollar", responseDays: 30 },
  civil: { title: "Гражданский спор / долг", description: "Расписка, займ, аренда, ЖКХ, банк, туризм, услуги или договор.", icon: "fa-file-invoice-dollar", responseDays: 30 },
};
const fallbackCategory = { title: "Претензия", description: "Документ, созданный в Досудебке.", icon: "fa-file-signature", responseDays: 10 };
const filters = [["all", "Все"], ["ordinary", "Обычные"], ["collective", "Коллективные"], ["sent", "Отправленные"]];
const categoryFilters = [["all", "Все категории"], ["labor", "Трудовой спор"], ["product", "Некачественный товар"], ["course", "Онлайн-курс"], ["debt", "Долг"]];
const methods = ["Почта России", "Email", "Через сайт ответчика", "Лично", "Другое"];
const objectValue = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const completedStatus = member => {
  const status = String(member?.status || "").toLowerCase();
  if (["pending", "invited", "draft", "incomplete"].includes(status)) return false;
  return ["completed", "done", "filled"].includes(status) || Boolean(member?.completedAt || member?.completed_at) || !status;
};
const hydrateCollectiveMember = (member, index) => {
  const claimData = objectValue(member?.claimData || member?.claim_data);
  const claimantData = objectValue(member?.claimantData || member?.claimant_data || claimData.workers?.[0] || claimData.claimantData || member);
  const circumstancesData = objectValue(member?.circumstancesData || member?.circumstances_data || member?.circumstances || claimData.circumstances);
  const evidenceData = objectValue(member?.evidenceData || member?.evidence_data || claimData.evidenceData);
  return {
    ...member,
    id: member?.id || member?.participantId || `saved-participant-${index + 1}`,
    participantId: member?.participantId || member?.participant_id || member?.id || "",
    slotIndex: Number(member?.slotIndex || member?.slot_index || index + 1),
    status: completedStatus(member) ? "completed" : String(member?.status || "pending").toLowerCase(),
    claimantData,
    circumstancesData,
    evidenceData: {
      ...evidenceData,
      selected: Array.isArray(evidenceData.selected) ? evidenceData.selected : Array.isArray(member?.evidence) ? member.evidence : Array.isArray(claimData.evidence) ? claimData.evidence : [],
      files: evidenceData.files || member?.evidenceFiles || member?.evidence_files || claimData.evidenceFiles || {},
    },
  };
};
const claimDataOf = doc => {
  const camel = objectValue(doc?.claimData);
  const snake = objectValue(doc?.claim_data);
  // Current documents are saved in claim_data; merge legacy claimData underneath it.
  const source = { ...camel, ...snake };
  const rawMembers = [
    source.collectiveMembers,
    source.collective_members,
    doc?.collectiveMembers,
    doc?.collective_members,
    source.members,
    source.members_data,
    doc?.members,
    doc?.members_data,
  ].find(Array.isArray);
  const hydratedMembers = rawMembers?.map(hydrateCollectiveMember)
    .filter(completedStatus)
    .sort((a, b) => a.slotIndex - b.slotIndex);
  const mode = source.mode || doc?.mode || ((hydratedMembers?.length || 0) > 1 || source.collectiveFinalized ? "collective" : "individual");
  const type = source.type || source.category || doc?.type || doc?.category || "";
  const result = {
    ...source,
    mode,
    type,
    employer: source.employer || source.respondent || objectValue(doc?.employer),
  };
  if (rawMembers) {
    result.collectiveMembers = hydratedMembers;
    if (!Array.isArray(result.workers) || result.workers.length < 2) {
      result.workers = hydratedMembers.map(member => member.claimantData);
    }
  }
  return result;
};
const isCollective = doc => doc.mode === "collective" || claimDataOf(doc).mode === "collective";
const isSent = doc => doc.status === "sent" || Boolean(doc.sentAt || doc.sent_date);
const memberCount = doc => claimDataOf(doc).collectiveMembers?.length || claimDataOf(doc).workers?.length || doc.participantsCount || 0;
const dateText = value => value ? new Date(value).toLocaleDateString("ru-RU") : "не указана";
const deadlineState = value => {
  if (!value) return ["Контрольный срок не указан", "waiting"];
  const due = new Date(value); const today = new Date();
  due.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
  if (due.getTime() === today.getTime()) return ["Сегодня контрольный срок", "today"];
  if (due < today) return ["Срок ответа истёк", "overdue"];
  return ["Ожидаем ответ", "waiting"];
};

const displayValue = value => {
  if (value === null || value === undefined || value === "" || (typeof value === "number" && !Number.isFinite(value))) return "Не указано";
  return String(value);
};
const displayAmount = value => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? `${amount.toLocaleString("ru-RU")} ₽` : "Не указано";
};
const memberDetailsOf = (data = {}) => (data.collectiveMembers || [])
  .filter(member => member?.status === "completed")
  .map((member, index) => {
    const claimant = objectValue(member.claimantData || member);
    const circumstances = objectValue(member.circumstancesData || member.circumstances);
    const evidenceData = objectValue(member.evidenceData);
    const selectedEvidence = Array.isArray(evidenceData.selected) ? evidenceData.selected : [];
    const filesByEvidence = objectValue(evidenceData.files);
    const files = Object.entries(filesByEvidence).flatMap(([label, values]) => {
      const list = Array.isArray(values) ? values : values ? [values] : [];
      return list.map(file => ({ label, name: file?.name || file?.fileName || "Файл без названия" }));
    });
    const workStart = circumstances.workStart || circumstances.workStartDate;
    const workEnd = circumstances.stillWorking ? "по настоящее время" : circumstances.workEnd || circumstances.workEndDate;
    const period = [workStart ? dateText(workStart) : "", workEnd === "по настоящее время" ? workEnd : workEnd ? dateText(workEnd) : ""].filter(Boolean).join(" — ");
    const legalFlags = [
      ...(Array.isArray(member.selectedLegalOptions) ? member.selectedLegalOptions : []),
      ...(Array.isArray(member.claimData?.selectedLegalOptions) ? member.claimData.selectedLegalOptions : []),
      ...(Array.isArray(circumstances.legalFlags) ? circumstances.legalFlags : []),
    ];
    return {
      id: member.id || member.participantId || index,
      number: index + 1,
      fullName: claimant.name || claimant.fullName,
      address: claimant.address,
      phone: claimant.phone,
      email: claimant.email,
      position: claimant.position || circumstances.position,
      workPeriod: period,
      workplaceAddress: circumstances.workplace || circumstances.workplaceAddress,
      debtAmount: circumstances.outstandingDebtAmount || circumstances.remainingDebtAmount || circumstances.debtAmount,
      paymentForm: Array.isArray(circumstances.paymentForm) ? circumstances.paymentForm.join(", ") : circumstances.paymentForm,
      description: circumstances.description,
      additional: [...new Set(legalFlags.filter(Boolean))].map(item => String(item).replace(/[_-]+/g, " ")).join(", "),
      selectedEvidence,
      files,
    };
  });

function DocumentDetailsModal({ doc, onClose, onDownloadPdf, onDownloadDoc }) {
  if (!doc) return null;
  const data = claimDataOf(doc);
  const collective = data.mode === "collective" && data.type === "labor";
  const respondent = data.employer || data.respondent || {};
  const participants = collective ? memberDetailsOf(data) : (data.workers || []).slice(0, 1).map((worker, index) => ({
    id: worker.id || index,
    number: 1,
    fullName: worker.name,
    address: worker.address,
    phone: worker.phone,
    email: worker.email,
    position: worker.position,
    workPeriod: "",
    workplaceAddress: data.circumstances?.workplace,
    debtAmount: data.circumstances?.outstandingDebtAmount || data.circumstances?.debtAmount,
    paymentForm: Array.isArray(data.circumstances?.paymentForm) ? data.circumstances.paymentForm.join(", ") : data.circumstances?.paymentForm,
    description: data.circumstances?.description,
    additional: "",
    selectedEvidence: data.evidence || [],
    files: Object.entries(objectValue(data.evidenceFiles)).flatMap(([label, values]) => (Array.isArray(values) ? values : values ? [values] : []).map(file => ({ label, name: file?.name || "Файл без названия" }))),
  }));
  const registrationLabel = String(respondent.type || "").toLowerCase().includes("ип") || String(respondent.ogrn || "").length === 15 ? "ОГРНИП" : "ОГРН";

  return <div className="document-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="document-modal" role="dialog" aria-modal="true" aria-labelledby="document-modal-title"><button className="document-modal-close" onClick={onClose} aria-label="Закрыть">×</button><h2 id="document-modal-title">{categories[doc.type]?.title || fallbackCategory.title}</h2><p className="document-modal-subtitle">{collective ? "Коллективная трудовая претензия" : "Индивидуальная претензия"}</p><h3>Ответчик</h3><dl><div><dt>Наименование</dt><dd>{displayValue(respondent.name || doc.respondent_name)}</dd></div><div><dt>Адрес</dt><dd>{displayValue(respondent.address)}</dd></div><div><dt>ИНН</dt><dd>{displayValue(respondent.inn)}</dd></div><div><dt>{registrationLabel}</dt><dd>{displayValue(respondent.ogrn)}</dd></div><div><dt>Создано</dt><dd>{dateText(doc.created_date || doc.createdAt)}</dd></div><div><dt>Статус</dt><dd>{isSent(doc) ? "Отправлено" : doc.status === "draft" ? "Черновик" : "Готово"}</dd></div></dl><h3>{collective ? "Заявители" : "Заявитель"}</h3><div className="document-modal-members">{participants.length ? participants.map(member => <article className="document-modal-member" key={member.id}><h4>Заявитель №{member.number}: {displayValue(member.fullName)}</h4><dl><div><dt>Адрес</dt><dd>{displayValue(member.address)}</dd></div><div><dt>Телефон</dt><dd>{displayValue(member.phone)}</dd></div><div><dt>Email</dt><dd>{displayValue(member.email)}</dd></div><div><dt>Должность</dt><dd>{displayValue(member.position)}</dd></div><div><dt>Период работы</dt><dd>{displayValue(member.workPeriod)}</dd></div><div><dt>Место работы</dt><dd>{displayValue(member.workplaceAddress)}</dd></div><div><dt>Задолженность</dt><dd>{displayAmount(member.debtAmount)}</dd></div><div><dt>Форма оплаты</dt><dd>{displayValue(member.paymentForm)}</dd></div></dl></article>) : <p className="document-modal-empty">Completed-заявители не найдены.</p>}</div><h3>Обстоятельства</h3>{participants.length ? participants.map(member => <article className="document-modal-member" key={`facts-${member.id}`}><h4>Заявитель №{member.number}: {displayValue(member.fullName)}</h4><dl><div><dt>Описание</dt><dd>{displayValue(member.description)}</dd></div><div><dt>Дополнительные обстоятельства</dt><dd>{displayValue(member.additional)}</dd></div><div><dt>Сумма долга</dt><dd>{displayAmount(member.debtAmount)}</dd></div><div><dt>Период работы</dt><dd>{displayValue(member.workPeriod)}</dd></div></dl></article>) : <p className="document-modal-empty">Не указано</p>}<h3>Доказательства</h3>{participants.length ? participants.map(member => <article className="document-modal-member" key={`evidence-${member.id}`}><h4>Заявитель №{member.number}: {displayValue(member.fullName)}</h4>{member.selectedEvidence.length ? <ul>{member.selectedEvidence.map((item, index) => <li key={`${item}-${index}`}>{displayValue(typeof item === "string" ? item : item?.label || item?.evidenceLabel)}</li>)}</ul> : <p className="document-modal-empty">Не указано</p>}{member.files.length > 0 && <><h5>Файлы</h5><ul>{member.files.map((file, index) => <li key={`${file.name}-${index}`}>{file.label}: {file.name}</li>)}</ul></>}</article>) : <p className="document-modal-empty">Не указано</p>}<div className="document-modal-actions"><button onClick={() => onDownloadPdf(doc)}>Скачать PDF</button><button onClick={() => onDownloadDoc(doc)}>Скачать DOCX для Word</button><button onClick={onClose}>Закрыть</button></div></section></div>;
}

function DeleteDocumentModal({ doc, busy, onCancel, onConfirm }) {
  if (!doc) return null;
  return <div className="document-modal-backdrop" role="presentation" onMouseDown={event => { if (!busy && event.target === event.currentTarget) onCancel(); }}><section className="delete-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-confirm-title" aria-describedby="delete-confirm-description"><h2 id="delete-confirm-title">Удалить претензию?</h2><p id="delete-confirm-description">Претензия будет удалена из личного кабинета. Это действие нельзя отменить.</p><div><button disabled={busy} onClick={onCancel}>Отмена</button><button disabled={busy} className="confirm-delete" onClick={onConfirm}>{busy ? "Удаление…" : "Удалить"}</button></div></section></div>;
}

export default function MyDocuments() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryDocId = searchParams.get("docId");
  const queryFilter = searchParams.get("filter");
  const [docs, setDocs] = useState([]);
  const [filter, setFilter] = useState(queryDocId ? "all" : queryFilter === "sent" ? "sent" : "all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(queryDocId);
  const [selectionError, setSelectionError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [messages, setMessages] = useState({});
  const [error, setError] = useState("");
  const [sendForm, setSendForm] = useState(null);
  const [openedDoc, setOpenedDoc] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user) return;
    try { setDocs(listDocuments({ userId: user.id, limit: 100 })); setError(""); }
    catch { setError("Не удалось загрузить претензии. Обновите страницу."); }
    finally { setLoaded(true); }
  }, [user]);

  useEffect(() => {
    if (!queryDocId || !loaded) return;
    const found = docs.some(doc => String(doc.id) === queryDocId);
    if (!found) { setSelectionError("Претензия не найдена или была удалена."); return; }
    setFilter("all"); setCategoryFilter("all"); setSelectedId(queryDocId); setSelectionError("");
    window.setTimeout(() => document.getElementById(`document-${queryDocId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }, [queryDocId, docs, loaded]);

  function changeFilter(next) { setFilter(next); setSelectedId(null); setSelectionError(""); }
  function changeCategory(next) { setCategoryFilter(next); setSelectedId(null); setSelectionError(""); }
  function openDocument(doc) {
    setSelectedId(String(doc.id));
    setOpenedDoc(doc);
    setSelectionError("");
  }

  const shown = useMemo(() => docs.filter(doc => {
    const matchesStatus = filter === "all" || (filter === "ordinary" && !isCollective(doc)) || (filter === "collective" && isCollective(doc)) || (filter === "sent" && isSent(doc));
    const matchesCategory = categoryFilter === "all" || doc.type === categoryFilter || (categoryFilter === "course" && doc.type === "infoproduct") || (categoryFilter === "debt" && doc.type === "civil");
    return matchesStatus && matchesCategory;
  }), [docs, filter, categoryFilter]);

  function openSendForm(doc) {
    const storedDate = doc.sentAt || doc.sent_date;
    setSendForm({ id: doc.id, date: storedDate ? new Date(storedDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10), method: doc.sentMethod || "Почта России" });
    setMessages(current => ({ ...current, [doc.id]: "" }));
  }
  function markSent(doc) {
    if (!sendForm?.date || !sendForm?.method) return;
    setBusyId(doc.id); setError("");
    try {
      const sentDate = new Date(`${sendForm.date}T12:00:00`);
      const sentAt = sentDate.toISOString();
      const responseDate = new Date(sentDate);
      responseDate.setDate(responseDate.getDate() + (categories[doc.type] || fallbackCategory).responseDays);
      const updated = updateDocument(doc.id, { status: "sent", sentAt, sent_date: sentAt, sentMethod: sendForm.method, responseDueAt: responseDate.toISOString() });
      setDocs(items => items.map(item => item.id === doc.id ? updated : item));
      setMessages(current => ({ ...current, [doc.id]: "Претензия отмечена как отправленная. Сохраните подтверждение отправки и дождитесь ответа." }));
      setSendForm(null);
    } catch { setError("Не удалось обновить претензию."); }
    finally { setBusyId(null); }
  }
  function remove(doc) {
    setDocumentToDelete(doc);
    setNotice("");
    setError("");
  }
  function confirmRemove() {
    const doc = documentToDelete;
    if (!doc) return;
    setBusyId(doc.id); setError(""); setNotice("");
    try {
      deleteDocument(doc.id);
      setDocs(items => items.filter(item => item.id !== doc.id));
      if (openedDoc?.id === doc.id) setOpenedDoc(null);
      if (sendForm?.id === doc.id) setSendForm(null);
      if (String(selectedId) === String(doc.id)) setSelectedId(null);
      setSelectionError("");
      if (String(queryDocId) === String(doc.id)) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("docId");
        setSearchParams(nextParams, { replace: true });
      }
      setDocumentToDelete(null);
      setNotice("Претензия удалена");
    } catch { setError("Не удалось удалить претензию"); }
    finally { setBusyId(null); }
  }
  function downloadPdf(doc) {
    try { generatePDF(claimDataOf(doc)); setError(""); }
    catch { setError("Не удалось сформировать PDF."); }
  }
  function downloadDoc(doc) {
    try {
      const blob = buildDocxBlob(claimDataOf(doc));
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = `pretenziya-${doc.id || "document"}.docx`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000); setError("");
    } catch { setError("Не удалось сформировать DOCX для Word."); }
  }

  return <div className="min-h-screen pt-24 pb-14 px-4"><style>{styles}{enhancements}{modalEnhancements}</style><div className="documents-shell">
    <Link className="back-button" to="/Dashboard"><i className="fa-solid fa-arrow-left"></i> Назад в личный кабинет</Link>
    <header><div><h1>Мои претензии</h1><p>Скачивайте документы, отслеживайте отправку и храните историю обращений.</p></div><Link to="/Generator"><i className="fa-solid fa-plus"></i> Создать претензию</Link></header>
    <aside className="send-info"><i className="fa-solid fa-circle-info"></i><div><b>Что значит «Отправлено»?</b><p>Эта отметка нужна только для вашего контроля. Сервис не отправляет претензию автоматически. Укажите дату и способ отправки, чтобы видеть ориентировочный срок ответа.</p><ul><li>PDF нужно отправить самостоятельно.</li><li>Сохраните чек, квитанцию, скриншот или письмо.</li><li>После отправки отметьте документ в кабинете.</li></ul></div></aside>
    <nav className="filters" aria-label="Фильтры претензий">{filters.map(([key, label]) => <button className={filter === key ? "active" : ""} onClick={() => changeFilter(key)} key={key}>{label}<span>{key === "all" ? docs.length : key === "ordinary" ? docs.filter(doc => !isCollective(doc)).length : key === "collective" ? docs.filter(isCollective).length : docs.filter(isSent).length}</span></button>)}</nav>
    <div className="category-filter"><b>Категория</b><nav className="filters" aria-label="Фильтр по категории">{categoryFilters.map(([key, label]) => <button className={categoryFilter === key ? "active" : ""} onClick={() => changeCategory(key)} key={key}>{label}</button>)}</nav></div>
    {selectionError && <p className="selection-error"><i className="fa-solid fa-circle-exclamation"></i>{selectionError}</p>}
    {notice && <p className="success-message global-message"><i className="fa-solid fa-circle-check"></i>{notice}</p>}
    {error && <p className="page-error">{error}</p>}
    <DocumentDetailsModal doc={openedDoc} onClose={() => setOpenedDoc(null)} onDownloadPdf={downloadPdf} onDownloadDoc={downloadDoc} />
    <DeleteDocumentModal doc={documentToDelete} busy={busyId === documentToDelete?.id} onCancel={() => setDocumentToDelete(null)} onConfirm={confirmRemove} />
    {shown.length ? <div className="document-grid">{shown.map(doc => {
      const category = categories[doc.type] || fallbackCategory;
      const collective = isCollective(doc); const sent = isSent(doc); const data = claimDataOf(doc);
      const [deadlineLabel, deadlineClass] = deadlineState(doc.responseDueAt);
      const selected = String(doc.id) === String(selectedId);
      return <article id={`document-${doc.id}`} className={`document-card ${selected ? "selected-document" : ""}`} key={doc.id}>{selected && <span className="selected-badge"><i className="fa-solid fa-location-dot"></i> Выбранная претензия</span>}<div className="card-top"><div className="category-icon"><i className={`fa-solid ${category.icon}`}></i></div><div className="title"><h2>{category.title}</h2><p>{category.description}</p><div><span className={collective ? "type collective" : "type"}>{collective ? "Коллективная" : "Обычная"}</span><span className={sent ? "status sent" : "status ready"}>{sent ? "Отправлено" : doc.status === "draft" ? "Черновик" : "Готово"}</span></div></div></div><dl><div><dt>Ответчик</dt><dd>{doc.respondent_name || data.employer?.name || "Не указан"}</dd></div><div><dt>Создано</dt><dd>{dateText(doc.created_date || doc.createdAt)}</dd></div>{collective && <div><dt>Участников</dt><dd>{memberCount(doc) || "Не указано"}</dd></div>}{sent && <><div><dt>Отправлено</dt><dd>{dateText(doc.sentAt || doc.sent_date)}</dd></div><div><dt>Способ</dt><dd>{doc.sentMethod || "Не указан"}</dd></div><div><dt>Ожидать ответ до</dt><dd>{dateText(doc.responseDueAt)}<span className={`deadline-badge ${deadlineClass}`}>{deadlineLabel}</span></dd></div></>}</dl>{sent && <><p className="due-note">Срок указан для личного контроля. Проверьте срок ответа в самой претензии.</p><p className="local-reminder">Это локальное напоминание в кабинете. Email/SMS появятся после подключения backend.</p></>}{messages[doc.id] && <p className="success-message"><i className="fa-solid fa-circle-check"></i>{messages[doc.id]}</p>}{sendForm?.id === doc.id && <div className="send-form"><b>Когда вы отправили претензию?</b><div><label>Дата отправки<input type="date" max={new Date().toISOString().slice(0, 10)} value={sendForm.date} onChange={event => setSendForm({ ...sendForm, date: event.target.value })} /></label><label>Способ отправки<select value={sendForm.method} onChange={event => setSendForm({ ...sendForm, method: event.target.value })}>{methods.map(method => <option key={method}>{method}</option>)}</select></label></div><div className="send-form-actions"><button onClick={() => markSent(doc)}>Сохранить отметку</button><button onClick={() => setSendForm(null)}>Отмена</button></div></div>}<div className="card-actions"><button onClick={() => openDocument(doc)}><i className="fa-solid fa-up-right-and-down-left-from-center"></i>Открыть</button><button onClick={() => downloadPdf(doc)}><i className="fa-regular fa-file-pdf"></i>Скачать PDF</button><button onClick={() => downloadDoc(doc)}><i className="fa-regular fa-file-word"></i>Скачать DOCX для Word</button><button disabled={busyId === doc.id} onClick={() => openSendForm(doc)} className="mark-button"><i className="fa-solid fa-paper-plane"></i>{sent ? "Изменить отметку" : "Отметить отправленной"}</button><button disabled={busyId === doc.id} onClick={() => remove(doc)} className="delete-button"><i className="fa-regular fa-trash-can"></i>Удалить</button></div></article>;
    })}</div> : <div className="empty"><i className="fa-regular fa-folder-open"></i><h2>{docs.length ? "В этом разделе претензий нет" : "Претензий пока нет"}</h2><p>{docs.length ? "Выберите другой фильтр." : "Создайте первую претензию — документ появится в личном кабинете."}</p>{!docs.length && <Link to="/Generator">Создать претензию</Link>}</div>}
    <TelegramHelp />
    <CabinetFooter />
  </div></div>;
}

function TelegramHelp() { return <aside className="telegram-help"><div className="telegram-icon"><i className="fa-brands fa-telegram"></i></div><div><h2>Не нашли свою ситуацию?</h2><p>Напишите нам в Telegram, если ваша проблема не подходит под готовые сценарии. Мы подскажем, как лучше оформить претензию, и заранее согласуем стоимость помощи.</p><small>Подходит для нестандартных случаев, сложных документов и ситуаций, где нужно разобрать детали.</small></div><a href="https://t.me/+mxSPQZosRBAwMTMy" target="_blank" rel="noopener noreferrer">Написать в Telegram</a></aside>; }
function CabinetFooter() { return <footer className="cabinet-footer"><span>© 2026 Досудебка — генерация юридических документов по законодательству РФ</span></footer>; }

const styles = `
.documents-shell{max-width:1080px;margin:0 auto;color:#e2e8f0}.back-button{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;margin-bottom:18px;border-radius:999px;border:1px solid rgba(34,211,238,.25);background:rgba(15,23,42,.58);color:#67e8f9;text-decoration:none;font-size:.76rem;transition:.2s}.back-button:hover{border-color:rgba(103,232,249,.5);box-shadow:0 0 22px rgba(34,211,238,.09);color:#a5f3fc}.documents-shell>header{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:22px}.documents-shell h1{font:800 clamp(1.7rem,4vw,2.2rem) 'Space Grotesk',sans-serif;color:white;margin:0 0 7px}.documents-shell header p{color:#94a3b8;margin:0;line-height:1.5}.documents-shell header>a,.empty a{display:inline-flex;align-items:center;gap:8px;padding:10px 15px;border-radius:10px;background:linear-gradient(135deg,#0891b2,#7c3aed);color:white;text-decoration:none;font-weight:700;font-size:.8rem;white-space:nowrap}.send-info{display:flex;gap:13px;padding:16px 18px;border-radius:15px;background:rgba(14,165,233,.055);border:1px solid rgba(34,211,238,.16);margin-bottom:18px}.send-info>i{color:#67e8f9;margin-top:2px}.send-info b{color:white;font-size:.86rem}.send-info p,.send-info li{color:#94a3b8;font-size:.77rem;line-height:1.55}.send-info p{margin:5px 0}.send-info ul{margin:7px 0 0;padding-left:18px}.filters{display:flex;gap:7px;overflow-x:auto;padding-bottom:7px;margin-bottom:14px}.filters button{display:flex;align-items:center;gap:7px;padding:8px 11px;border-radius:9px;border:1px solid rgba(148,163,184,.12);background:rgba(15,23,42,.54);color:#94a3b8;font-size:.76rem;cursor:pointer;white-space:nowrap}.filters button.active{color:#67e8f9;border-color:rgba(34,211,238,.27);background:rgba(34,211,238,.07)}.filters span{padding:1px 5px;border-radius:5px;background:rgba(255,255,255,.06);font-size:.64rem}.document-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.document-card{min-width:0;padding:18px;border-radius:17px;background:rgba(15,23,42,.64);border:1px solid rgba(148,163,184,.12);box-shadow:0 12px 40px rgba(2,6,23,.17);transition:.2s}.document-card:hover{border-color:rgba(167,139,250,.24);transform:translateY(-1px)}.card-top{display:flex;gap:12px}.category-icon{width:43px;height:43px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(135deg,rgba(14,165,233,.13),rgba(139,92,246,.13));color:#67e8f9;flex:0 0 auto}.title{min-width:0}.title h2{font-size:.94rem;color:white;margin:1px 0 4px}.title>p{color:#64748b;font-size:.69rem;line-height:1.4;margin:0 0 8px}.title>div{display:flex;gap:6px;flex-wrap:wrap}.type,.status{padding:3px 7px;border-radius:7px;font-size:.64rem;border:1px solid rgba(34,211,238,.17);background:rgba(34,211,238,.07);color:#67e8f9}.type.collective{color:#c4b5fd;border-color:rgba(167,139,250,.2);background:rgba(139,92,246,.09)}.status.sent{color:#86efac;border-color:rgba(74,222,128,.2);background:rgba(34,197,94,.08)}.status.ready{color:#67e8f9}.document-card dl{margin:16px 0;display:grid;gap:8px}.document-card dl>div{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,.045);padding-bottom:7px}.document-card dt{color:#64748b;font-size:.72rem}.document-card dd{color:#cbd5e1;font-size:.73rem;margin:0;text-align:right;overflow-wrap:anywhere}.due-note{color:#64748b;font-size:.67rem;line-height:1.4}.send-form{padding:13px;border-radius:12px;background:rgba(14,165,233,.045);border:1px solid rgba(34,211,238,.16);margin:12px 0}.send-form>b{color:white;font-size:.79rem}.send-form>div:not(.send-form-actions){display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.send-form label{display:grid;gap:5px;color:#94a3b8;font-size:.68rem}.send-form input,.send-form select{width:100%;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,.16);background:#111827;color:#e2e8f0}.send-form-actions{display:flex;gap:7px;margin-top:10px}.send-form-actions button{padding:8px 10px;border-radius:8px;border:1px solid rgba(34,211,238,.2);background:rgba(34,211,238,.08);color:#67e8f9;cursor:pointer}.send-form-actions button:last-child{border-color:rgba(148,163,184,.14);background:transparent;color:#94a3b8}.card-actions{display:flex;gap:7px;flex-wrap:wrap}.card-actions button{display:inline-flex;align-items:center;gap:6px;padding:8px 9px;border-radius:8px;border:1px solid rgba(148,163,184,.13);background:rgba(255,255,255,.04);color:#cbd5e1;font-size:.69rem;cursor:pointer}.card-actions button:hover:not(:disabled){border-color:rgba(34,211,238,.3);color:#a5f3fc}.card-actions .mark-button{color:#67e8f9}.card-actions .delete-button:hover:not(:disabled){color:#fda4af;border-color:rgba(251,113,133,.3)}.card-actions button:disabled{cursor:default;opacity:.62}.success-message{display:flex;gap:7px;color:#86efac;background:rgba(34,197,94,.07);border:1px solid rgba(74,222,128,.14);border-radius:9px;padding:9px;font-size:.7rem;line-height:1.4}.empty{text-align:center;padding:45px 20px;border:1px dashed rgba(148,163,184,.15);border-radius:17px;background:rgba(15,23,42,.35)}.empty>i{font-size:1.8rem;color:#64748b}.empty h2{color:white;font-size:1rem}.empty p{color:#64748b;font-size:.8rem}.page-error{color:#fda4af;font-size:.8rem}@media(max-width:760px){.documents-shell>header{align-items:flex-start;flex-direction:column}.document-grid{grid-template-columns:1fr}.document-card{padding:15px}.card-actions button{flex:1 1 145px;justify-content:center}.send-form>div:not(.send-form-actions){grid-template-columns:1fr}}`;

const modalEnhancements = `
.document-modal-members{display:grid;gap:12px}.document-modal-member{padding:13px;border:1px solid rgba(148,163,184,.12);border-radius:12px;background:rgba(255,255,255,.025)}.document-modal-member h4{margin:0 0 11px;color:#c4b5fd;font-size:.82rem}.document-modal-member h5{margin:10px 0 6px;color:#94a3b8;font-size:.75rem}.document-modal-member ul{margin:6px 0 0;padding-left:20px}.document-modal-member li{margin:4px 0;color:#cbd5e1;font-size:.78rem;overflow-wrap:anywhere}.document-modal-member dl:last-child{margin-bottom:0}.document-modal-empty{margin:7px 0;color:#64748b;font-size:.78rem}.card-actions .delete-button{color:#fda4af;border-color:rgba(251,113,133,.2);background:rgba(244,63,94,.055)}.global-message{margin:0 0 14px}.delete-confirm-modal{width:min(430px,100%);padding:24px;border-radius:17px;border:1px solid rgba(251,113,133,.22);background:#0f172a;box-shadow:0 24px 80px rgba(0,0,0,.5)}.delete-confirm-modal h2{margin:0 0 10px;color:#fff;font-size:1.15rem}.delete-confirm-modal p{margin:0;color:#94a3b8;font-size:.8rem;line-height:1.55}.delete-confirm-modal>div{display:flex;justify-content:flex-end;gap:9px;margin-top:22px}.delete-confirm-modal button{padding:9px 14px;border-radius:9px;border:1px solid rgba(148,163,184,.16);background:transparent;color:#cbd5e1;cursor:pointer}.delete-confirm-modal .confirm-delete{border-color:rgba(251,113,133,.25);background:rgba(244,63,94,.12);color:#fda4af}.delete-confirm-modal button:disabled{cursor:default;opacity:.6}`;

const enhancements = `
.category-filter{margin:-2px 0 14px;padding-top:11px;border-top:1px solid rgba(148,163,184,.08)}.category-filter>b{display:block;color:#94a3b8;font-size:.7rem;margin-bottom:8px}.category-filter .filters{margin-bottom:0}.selection-error{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;color:#fda4af;background:rgba(244,63,94,.06);border:1px solid rgba(251,113,133,.15);font-size:.75rem}.selected-document{border-color:rgba(34,211,238,.55);box-shadow:0 0 0 1px rgba(139,92,246,.18),0 0 32px rgba(34,211,238,.12)}.selected-badge{display:inline-flex;align-items:center;gap:6px;margin-bottom:11px;padding:4px 8px;border-radius:7px;background:linear-gradient(135deg,rgba(14,165,233,.13),rgba(139,92,246,.13));color:#a5f3fc;font-size:.65rem}.deadline-badge{display:block;margin-top:4px;font-size:.62rem;color:#67e8f9}.deadline-badge.today{color:#fbbf24}.deadline-badge.overdue{color:#fda4af}.local-reminder{color:#64748b;font-size:.65rem;line-height:1.4;padding-left:8px;border-left:2px solid rgba(34,211,238,.18)}.document-modal-backdrop{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:18px;background:rgba(2,6,23,.78);backdrop-filter:blur(7px)}.document-modal{position:relative;width:min(680px,100%);max-height:88vh;overflow:auto;padding:24px;border-radius:18px;border:1px solid rgba(103,232,249,.22);background:#0f172a;box-shadow:0 24px 80px rgba(0,0,0,.45)}.document-modal-close{position:absolute;right:14px;top:12px;width:34px;height:34px;border-radius:9px;border:1px solid rgba(148,163,184,.16);background:rgba(255,255,255,.04);color:#cbd5e1;font-size:1.35rem;cursor:pointer}.document-modal h2{margin:0 42px 4px 0;color:#fff;font-size:1.25rem}.document-modal-subtitle{margin:0 0 18px;color:#67e8f9;font-size:.78rem}.document-modal dl{display:grid;gap:8px;margin:0 0 18px}.document-modal dl>div{display:grid;grid-template-columns:140px 1fr;gap:12px;padding-bottom:8px;border-bottom:1px solid rgba(148,163,184,.1)}.document-modal dt{color:#64748b;font-size:.75rem}.document-modal dd{margin:0;color:#e2e8f0;font-size:.8rem;overflow-wrap:anywhere}.document-modal h3{margin:18px 0 8px;color:#fff;font-size:.88rem}.document-modal-claimants{display:grid;gap:8px;margin:0;padding-left:22px}.document-modal-claimants li{color:#cbd5e1;font-size:.78rem}.document-modal-claimants span{display:block;color:#94a3b8;margin-top:2px}.document-modal-text{color:#cbd5e1;font-size:.8rem;line-height:1.55}.document-modal-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:22px}.document-modal-actions button{padding:9px 12px;border-radius:9px;border:1px solid rgba(34,211,238,.22);background:rgba(34,211,238,.08);color:#a5f3fc;cursor:pointer}.document-modal-actions button:last-child{margin-left:auto;border-color:rgba(148,163,184,.16);background:transparent;color:#94a3b8}.telegram-help{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:16px;margin-top:28px;padding:21px;border-radius:18px;background:linear-gradient(135deg,rgba(14,165,233,.075),rgba(139,92,246,.075));border:1px solid rgba(103,232,249,.2);box-shadow:0 14px 45px rgba(34,211,238,.06)}.telegram-icon{width:50px;height:50px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(135deg,#0891b2,#7c3aed);color:white;font-size:1.35rem}.telegram-help h2{color:white;font-size:1.05rem;margin:0 0 5px}.telegram-help p{color:#94a3b8;font-size:.76rem;line-height:1.5;margin:0 0 5px}.telegram-help small{color:#64748b;font-size:.67rem}.telegram-help>a{padding:10px 14px;border-radius:10px;background:linear-gradient(135deg,#0891b2,#7c3aed);color:white;text-decoration:none;font-size:.75rem;font-weight:750;white-space:nowrap}.cabinet-footer{display:flex;gap:16px;margin-top:30px;padding-top:18px;border-top:1px solid rgba(148,163,184,.1);color:#64748b;font-size:.68rem}@media(max-width:700px){.document-modal{padding:20px 16px}.document-modal dl>div{grid-template-columns:1fr;gap:3px}.document-modal-actions button{flex:1 1 150px}.document-modal-actions button:last-child{margin-left:0}.telegram-help{grid-template-columns:auto 1fr}.telegram-help>a{grid-column:1/-1;text-align:center}.cabinet-footer{flex-direction:column}}`;
