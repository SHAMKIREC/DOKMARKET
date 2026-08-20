import { useEffect, useState } from "react";
import { getCompletedParticipants, getRoom, getRoomParticipants, getTotalParticipants } from "@/services/collectiveService";

function participantForm(count) {
  return count % 10 === 1 && count % 100 !== 11 ? "участником" : "участниками";
}

export default function CollectiveProgress({ claimData, onFinalize, isOwner }) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const roomId = claimData.roomId;
  const shareLink = `${window.location.origin}/join/${roomId}`;

  useEffect(() => { void loadRoom(); }, [roomId]);

  async function loadRoom() {
    setLoading(true);
    try {
      const latest = await getRoom(roomId);
      setRoom(latest);
      setError(latest ? "" : "Комната совместной претензии не найдена.");
    } catch {
      setError("Не удалось загрузить прогресс комнаты. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Не удалось скопировать ссылку. Скопируйте её вручную.");
    }
  }

  if (loading) return <div style={{ textAlign: "center", padding: 48 }}><div className="w-8 h-8 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin mx-auto" /></div>;

  if (!isOwner) return <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,.03)", padding: "clamp(20px,5vw,36px)", textAlign: "center" }}><h3 style={{ color: "white", fontSize: "1.45rem", fontWeight: 800, marginBottom: 10 }}>Ваши данные сохранены</h3><p style={{ color: "#cbd5e1", lineHeight: 1.6, margin: "0 0 8px" }}>Организатор уже видит ваш статус на своём устройстве.</p><p style={{ color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>После проверки организатор сформирует итоговый документ.</p></div>;

  const members = getRoomParticipants(room);
  const completedCount = getCompletedParticipants(room).length;
  const total = getTotalParticipants(room) || Number(claimData.totalParticipants || claimData.maxMembers || 0);
  const ownerCompleted = members.some(member => member.role === "owner" && member.status === "completed");
  const allDone = total > 0 && completedCount === total;
  const canFinalize = ownerCompleted && completedCount >= 2;

  return <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,.03)", padding: "clamp(16px,5vw,32px)" }}>
    {error && <p style={{ color: "#fbbf24", marginBottom: 16 }}>{error}</p>}
    <div style={{ textAlign: "center", marginBottom: 24 }}><h3 style={{ fontWeight: 800, color: "white", fontSize: "1.4rem", marginBottom: 7 }}>{allDone ? "Все участники заполнили данные" : "Прогресс совместной претензии"}</h3><p style={{ color: "#cbd5e1", fontSize: ".92rem", marginBottom: 6 }}>{allDone ? "Совместная претензия готова к проверке" : "Отправьте ссылку участникам и следите за заполнением с любого устройства."}</p><p style={{ color: "#a78bfa", fontWeight: 800, fontSize: "1.05rem", margin: 0 }}>{completedCount} из {total} участников заполнили данные</p></div>
    <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 8, height: 10, marginBottom: 24, overflow: "hidden" }}><div style={{ height: "100%", width: `${total ? Math.min(100, Math.round(completedCount / total * 100)) : 0}%`, background: "linear-gradient(90deg,#8b5cf6,#22d3ee)", transition: "width .3s ease" }} /></div>
    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 24 }}>{members.map(member => { const completed = member.status === "completed"; return <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 10, background: completed ? "rgba(74,222,128,.05)" : "rgba(255,255,255,.025)", border: `1px solid ${completed ? "rgba(74,222,128,.18)" : "rgba(255,255,255,.07)"}` }}><span style={{ color: "#e2e8f0", fontSize: ".9rem", fontWeight: member.role === "owner" ? 700 : 600 }}>{member.role === "owner" ? "Вы (организатор)" : `Участник ${member.slotIndex}`}</span><span style={{ color: completed ? "#4ade80" : member.status === "in_progress" ? "#60a5fa" : "#fbbf24", fontSize: ".84rem", fontWeight: 700 }}>{completed ? "Заполнено" : member.status === "in_progress" ? "Заполняет" : "Ожидается"}</span></div>; })}</div>
    {!allDone && <div style={{ background: "rgba(139,92,246,.08)", border: "1px solid rgba(139,92,246,.25)", borderRadius: 14, padding: 18, marginBottom: 18 }}><p style={{ color: "#ddd6fe", fontWeight: 700, margin: "0 0 8px" }}>{completedCount < 2 ? "Пригласите ещё участника" : "Ссылка для остальных участников"}</p><p style={{ color: "#cbd5e1", fontSize: ".82rem", lineHeight: 1.55, margin: "0 0 12px" }}>Каждый участник открывает эту ссылку на своём телефоне. В документ попадут только завершившие заполнение.</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><div style={{ flex: 1, minWidth: 190, padding: "10px 12px", borderRadius: 8, background: "rgba(0,0,0,.25)", color: "#94a3b8", fontSize: ".78rem", wordBreak: "break-all" }}>{shareLink}</div><button onClick={copyLink} style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(139,92,246,.18)", border: "1px solid rgba(139,92,246,.4)", color: "#c4b5fd", fontWeight: 700, cursor: "pointer" }}>{copied ? "Скопировано" : "Скопировать ссылку"}</button></div></div>}
    <button onClick={loadRoom} style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", color: "#cbd5e1", fontWeight: 650, cursor: "pointer" }}>Обновить статус с сервера</button>
    <button onClick={canFinalize ? onFinalize : undefined} disabled={!canFinalize} style={{ width: "100%", padding: 14, borderRadius: 12, border: canFinalize ? "none" : "1px solid rgba(255,255,255,.08)", background: canFinalize ? "linear-gradient(135deg,#0ea5e9,#8b5cf6)" : "rgba(255,255,255,.04)", color: canFinalize ? "white" : "#64748b", fontWeight: 800, cursor: canFinalize ? "pointer" : "not-allowed" }}>{!canFinalize ? "Нужен ещё минимум 1 участник" : allDone ? "Перейти к финальной проверке" : `Продолжить с ${completedCount} ${participantForm(completedCount)}`}</button>
  </div>;
}