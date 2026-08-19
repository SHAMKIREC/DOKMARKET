import { useState, useEffect } from "react";
import { getRoom, updateRoom } from "@/services/collectiveService";
import { createDocument } from "@/services/documentService";
import { generateCollectivePDF, buildCollectiveDocxHtml } from "./pdfGenerator";

const PRICE_PER_MEMBER = 790;

export default function CollectiveOwnerStep7({ claimData, reset, prevStep }) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const [saveError, setSaveError] = useState("");

  const roomId = claimData.roomId;
  const joinUrl = `${window.location.origin}/join/${roomId}`;

  useEffect(() => { initRoom(); }, []);

  async function initRoom() {
    setLoading(true);
    try {
      const r = getRoom(roomId);
      if (!r) {
        setSaveError("Комната коллективной претензии не найдена.");
        return;
      }
      updateRoom(r.id, { employer_data: claimData.employer, owner_claim_data: claimData, status: "collecting" });
      setRoom(getRoom(roomId) || r);
    } catch {
      console.error("Не удалось подготовить коллективную комнату.");
      setSaveError("Не удалось загрузить коллективную комнату. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    try {
      const latestRoom = getRoom(roomId);
      if (latestRoom) {
        setRoom(latestRoom);
        setSaveError("");
      } else setSaveError("Комната коллективной претензии не найдена.");
    } catch {
      console.error("Не удалось обновить коллективную комнату.");
      setSaveError("Не удалось обновить данные комнаты. Попробуйте ещё раз.");
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      console.error("Не удалось скопировать ссылку на коллективную комнату.");
      setSaveError("Не удалось скопировать ссылку. Скопируйте её вручную.");
    });
  }

  async function handleGenerate() {
    setGenerated(true);
    try {
        createDocument({
          type: claimData.type,
          subtype: claimData.subtype || "",
          respondent_name: claimData.employer?.name || "",
          claim_data: claimData,
          status: "ready",
        });
        setSaveError("");
    } catch {
      console.error("Не удалось сохранить коллективный документ локально.");
      setSaveError("Документ создан, но не сохранился в «Мои документы». Попробуйте ещё раз.");
    }
  }

  async function handleDownloadPDF() {
    try {
      await generateCollectivePDF(room);
      setSaveError("");
    } catch {
      console.error("Не удалось сформировать PDF коллективной претензии.");
      setSaveError("Не удалось скачать PDF. Попробуйте ещё раз.");
    }
  }

  function handleDownloadDOCX() {
    try {
      const html = buildCollectiveDocxHtml(room);
      const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pretenziya_kollektivnaya_${Date.now()}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      setSaveError("");
    } catch {
      console.error("Не удалось сформировать DOC коллективной претензии.");
      setSaveError("Не удалось скачать DOC. Попробуйте ещё раз.");
    }
  }

  function handlePay() {
    window.open("https://t.me/+mxSPQZosRBAwMTMy", "_blank");
    setTimeout(() => setPaid(true), 5000);
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "1.5rem", marginBottom: 12, display: "block" }}></i>
        Сохранение данных...
      </div>
    );
  }

  if (!room) {
    return <div style={{ textAlign: "center", padding: 40, color: "#fbbf24" }}>{saveError || "Комната коллективной претензии не найдена."}</div>;
  }

  const members = room.members_data || [];
  const doneMembersCount = members.filter(m => m.status === "done").length;
  const totalFilled = 1 + doneMembersCount;
  const totalPrice = PRICE_PER_MEMBER * totalFilled;
  const allFilled = doneMembersCount >= room.max_members - 1;
  const canGenerate = allFilled || confirmed;

  return (
    <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)", padding: "clamp(16px,5vw,32px)" }}>
      {saveError && <p style={{ color: "#fbbf24", marginBottom: 16, fontSize: "0.85rem" }}>{saveError}</p>}
      {!generated ? (
        <>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 800, color: "white", fontSize: "1.3rem", marginBottom: 4 }}>
              <i className="fa-solid fa-check-circle" style={{ marginRight: 10, color: "#4ade80" }}></i>
              Вы заполнили свою часть
            </h3>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
              Передайте ссылку остальным участникам
            </p>
          </div>

          {/* Share link */}
          <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <p style={{ color: "#a78bfa", fontWeight: 600, fontSize: "0.85rem", marginBottom: 10 }}>
              <i className="fa-solid fa-link" style={{ marginRight: 6 }}></i>
              Ссылка для участников
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "stretch", flexWrap: "wrap" }}>
              <div style={{ flex: 1, background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "10px 12px", fontSize: "0.75rem", color: "#d1d5db", wordBreak: "break-all", fontFamily: "monospace", minWidth: 0 }}>
                {joinUrl}
              </div>
              <button onClick={copyLink}
                style={{ padding: "10px 16px", borderRadius: 8, background: copied ? "rgba(74,222,128,0.2)" : "rgba(139,92,246,0.2)", border: `1px solid ${copied ? "rgba(74,222,128,0.4)" : "rgba(139,92,246,0.4)"}`, color: copied ? "#4ade80" : "#a78bfa", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                {copied ? <><i className="fa-solid fa-check" style={{ marginRight: 6 }}></i>Скопировано</> : <><i className="fa-solid fa-copy" style={{ marginRight: 6 }}></i>Скопировать</>}
              </button>
            </div>
          </div>

          {/* Progress */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ color: "white", fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>
                {totalFilled} из {room.max_members} участников заполнили данные
              </p>
              <button onClick={refresh} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "0.8rem" }}>
                <i className="fa-solid fa-rotate-right" style={{ marginRight: 4 }}></i>Обновить
              </button>
            </div>

            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 999, height: 6, marginBottom: 14, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#8b5cf6,#22d3ee)", width: `${(totalFilled / room.max_members) * 100}%`, transition: "width 0.4s" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Owner row */}
              <MemberRow label={room.owner_claim_data?.workers?.[0]?.name || "Вы (создатель)"} status="done" isOwner />
              {/* Other slots */}
              {Array.from({ length: room.max_members - 1 }, (_, i) => {
                const m = members[i];
                return <MemberRow key={i} label={m?.name || `Участник ${i + 2}`} status={m ? m.status : "pending"} />;
              })}
            </div>
          </div>

          {/* Confirm to generate with partial members */}
          {!allFilled && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: "#0ea5e9", flexShrink: 0 }} />
                <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                  Завершить с текущими участниками ({totalFilled} из {room.max_members}) и сформировать документ
                </span>
              </label>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={prevStep} style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 600 }}>Назад</button>
            <button onClick={handleGenerate} disabled={!canGenerate}
              style={{ flex: 2, minWidth: 140, padding: "13px", borderRadius: 12, background: canGenerate ? "linear-gradient(135deg,#0ea5e9,#8b5cf6)" : "rgba(255,255,255,0.08)", border: "none", color: canGenerate ? "white" : "#6b7280", cursor: canGenerate ? "pointer" : "not-allowed", fontWeight: 700 }}>
              <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 8 }}></i>
              Перейти к формированию документа
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 800, color: "white", fontSize: "1.3rem", marginBottom: 4 }}>🎉 Документ готов</h3>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Количество участников: <span style={{ color: "#22d3ee", fontWeight: 600 }}>{totalFilled}</span></p>
          </div>

          {/* Pricing */}
          <div style={{ background: "linear-gradient(135deg,rgba(14,165,233,0.08),rgba(139,92,246,0.1))", border: "1px solid rgba(14,165,233,0.3)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: 6 }}>790 ₽ × {totalFilled} участников</p>
            <p style={{ color: "white", fontWeight: 800, fontSize: "1.8rem", marginBottom: 4 }}>Итого: {totalPrice.toLocaleString("ru-RU")} ₽</p>
            <p style={{ color: "#6b7280", fontSize: "0.78rem" }}>Вы платите только за участников, которые заполнили данные</p>
          </div>

          {/* Download */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <button onClick={handleDownloadPDF}
              style={{ padding: "13px", borderRadius: 10, border: "1px solid rgba(248,113,113,0.4)", background: "rgba(248,113,113,0.12)", color: "#f87171", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <i className="fa-regular fa-file-pdf"></i> Скачать PDF
            </button>
            <button onClick={handleDownloadDOCX}
              style={{ padding: "13px", borderRadius: 10, border: "1px solid rgba(96,165,250,0.4)", background: "rgba(96,165,250,0.12)", color: "#60a5fa", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <i className="fa-regular fa-file-word"></i> Скачать DOCX
            </button>
          </div>

          {!paid ? (
            <button onClick={handlePay}
              style={{ width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", border: "none", color: "white", fontWeight: 700, fontSize: "1rem", cursor: "pointer", marginBottom: 10 }}>
              <i className="fa-solid fa-lock-open" style={{ marginRight: 8 }}></i>
              Оплатить доступ — {totalPrice.toLocaleString("ru-RU")} ₽
            </button>
          ) : (
            <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 10, padding: "12px 16px", textAlign: "center", marginBottom: 10 }}>
              <p style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.95rem", margin: 0 }}>
                <i className="fa-solid fa-check-circle" style={{ marginRight: 8 }}></i>Оплата прошла успешно
              </p>
            </div>
          )}

          <button onClick={reset} style={{ display: "block", width: "100%", padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem" }}>
            <i className="fa-solid fa-rotate-right" style={{ marginRight: 6 }}></i>Создать новую претензию
          </button>
        </>
      )}
    </div>
  );
}

function MemberRow({ label, status, isOwner }) {
  const colors = {
    done: { bg: "rgba(74,222,128,0.06)", border: "rgba(74,222,128,0.2)", text: "#4ade80", badge: "✓ заполнено" },
    filling: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", text: "#fbbf24", badge: "⏳ заполняет" },
    pending: { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.08)", text: "#6b7280", badge: "— не начал" },
  };
  const c = colors[status] || colors.pending;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: c.bg, border: `1px solid ${c.border}` }}>
      <span style={{ color: "#d1d5db", fontSize: "0.85rem" }}>
        {isOwner && <i className="fa-solid fa-crown" style={{ marginRight: 6, color: "#fbbf24", fontSize: "0.7rem" }}></i>}
        {label}
      </span>
      <span style={{ color: c.text, fontSize: "0.78rem", fontWeight: 600 }}>{c.badge}</span>
    </div>
  );
}
