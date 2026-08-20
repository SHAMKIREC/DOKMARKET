import { useState } from "react";

function formatSize(bytes) {
  if (!bytes || bytes === 0) return "0 Б";
  if (bytes < 1024) return bytes + " Б";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " КБ";
  return (bytes / (1024 * 1024)).toFixed(1) + " МБ";
}

function getFileIcon(name) {
  const ext = (name || "").split(".").pop()?.toLowerCase();
  if (ext === "pdf") return { icon: "fa-file-pdf", color: "#f87171" };
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return { icon: "fa-file-image", color: "#60a5fa" };
  if (["doc", "docx"].includes(ext)) return { icon: "fa-file-word", color: "#60a5fa" };
  if (["xls", "xlsx"].includes(ext)) return { icon: "fa-file-excel", color: "#4ade80" };
  return { icon: "fa-file", color: "#9ca3af" };
}

export default function FileAttachment({ file, evidenceLabel, onView, onDelete }) {
  const [imgExpanded, setImgExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const { icon, color } = getFileIcon(file.name);
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(file.name || "");
  const canView = Boolean(file.url || file.storagePath);
  const fileType = isImage ? "Изображение" : ((file.name || "").split(".").pop()?.toUpperCase() || "Файл");

  async function handleView() {
    if (isImage && file.url) {
      setImgExpanded(value => !value);
      return;
    }
    if (!onView) return;
    setBusy(true);
    try { await onView(file); } finally { setBusy(false); }
  }

  async function handleDelete() {
    if (!onDelete || busy) return;
    setBusy(true);
    try { await onDelete(file); } finally { setBusy(false); }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <i className={`fa-regular ${icon}`} style={{ color, fontSize: "1.1rem", flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <p style={{ color: "#4ade80", fontSize: "0.82rem", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
          <p style={{ color: "#6b7280", fontSize: "0.72rem", margin: "2px 0 0" }}>{fileType} · {formatSize(file.size)}{file.storagePath ? " · сохранён" : " · локально"}</p>
          {evidenceLabel && <p style={{ color: "#64748b", fontSize: "0.68rem", margin: "2px 0 0" }}>К доказательству: {evidenceLabel}</p>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {canView && <button type="button" disabled={busy} onClick={handleView} style={{ padding: "5px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)", color: "#22d3ee", cursor: busy ? "wait" : "pointer", whiteSpace: "nowrap" }}><i className={`fa-solid ${busy ? "fa-spinner fa-spin" : isImage && imgExpanded ? "fa-eye-slash" : "fa-eye"}`} style={{ marginRight: 4 }} />{busy ? "Открываем" : isImage && imgExpanded ? "Скрыть" : "Просмотреть"}</button>}
        {onDelete && <button type="button" disabled={busy} onClick={handleDelete} style={{ padding: "5px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.25)", color: "#f87171", cursor: busy ? "wait" : "pointer", whiteSpace: "nowrap" }}><i className="fa-solid fa-trash" style={{ marginRight: 4 }} />Удалить</button>}
      </div>
      {isImage && imgExpanded && file.url && <div style={{ width: "100%", marginTop: 8 }}><img src={file.url} alt={file.name} style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }} /></div>}
    </div>
  );
}
