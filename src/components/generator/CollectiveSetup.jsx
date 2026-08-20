import { useState } from "react";
import { createRoom as createCollectiveRoom } from "@/services/collectiveService";

function genRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString(36).slice(-3).toUpperCase();
}

function pluralParticipants(n) {
  if (n % 100 >= 11 && n % 100 <= 19) return `${n} участников`;
  const r = n % 10;
  if (r === 1) return `${n} участник`;
  if (r >= 2 && r <= 4) return `${n} участника`;
  return `${n} участников`;
}

export default function CollectiveSetup({ claimData, updateClaimData, nextStep, prevStep }) {
  const [count, setCount] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createRoom() {
    if (!count) return;
    setCreating(true);
    setError("");
    const roomId = genRoomId();
    try {
      const room = await createCollectiveRoom({
        room_id: roomId,
        type: claimData.type || "",
        subtype: claimData.subtype || "",
        mode: "collective",
        totalParticipants: count,
        max_members: count,
        claim_type: claimData.type || "",
        claim_subtype: claimData.subtype || "",
        employer: {},
        status: "active",
      });
      localStorage.setItem("legalpro_room_owner", room.room_id);
      localStorage.setItem("legalpro_collective_active_owner_room", room.room_id);
      updateClaimData({ mode: "collective", roomId: room.room_id, maxMembers: count, totalParticipants: count, collectiveFinalized: false });
      nextStep();
    } catch (e) {
      console.error("Не удалось создать коллективную комнату.", e);
      setError(e?.message === "AUTH_REQUIRED" ? "Для совместной претензии войдите в аккаунт. Комната должна храниться на сервере." : "Ошибка создания комнаты. Попробуйте ещё раз.");
    } finally {
      setCreating(false);
    }
  }

  const rows = [
    [2, 3, 4, 5, 6],
    [7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16],
    [17, 18, 19, 20],
  ];

  return (
    <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)", padding: "clamp(16px,5vw,32px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(167,139,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa", fontSize: "1.4rem", flexShrink: 0 }}>
          <i className="fa-solid fa-users"></i>
        </div>
        <div>
          <h3 style={{ fontWeight: 800, color: "white", fontSize: "1.25rem", margin: 0 }}>Создание групповой претензии</h3>
          <p style={{ color: "#9ca3af", fontSize: "0.82rem", margin: "2px 0 0" }}>Каждый участник заполнит свои данные со своего устройства. В конце всё объединится в один документ</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0 20px" }}>
        {["Каждый заполняет только свои данные", "Данные сохраняются на сервере", "Вы управляете группой"].map((hint) => (
          <span key={hint} style={{ fontSize: "0.73rem", padding: "4px 10px", borderRadius: 20, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#c4b5fd" }}>{hint}</span>
        ))}
      </div>

      <p style={{ color: "#d1d5db", fontWeight: 600, marginBottom: 14, fontSize: "0.95rem" }}>Сколько человек участвует?</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: "grid", gridTemplateColumns: `repeat(${row.length}, 1fr)`, gap: 8 }}>
            {row.map(n => (
              <button key={n} type="button" onClick={() => setCount(n)} style={{ padding: "16px 0", borderRadius: 12, fontWeight: 700, fontSize: "1rem", cursor: "pointer", border: `2px solid ${count === n ? "#a78bfa" : "rgba(255,255,255,0.1)"}`, background: count === n ? "rgba(139,92,246,0.22)" : "rgba(255,255,255,0.03)", color: count === n ? "#a78bfa" : "#d1d5db", transition: "all 0.12s", boxShadow: count === n ? "0 0 0 3px rgba(139,92,246,0.15)" : "none" }}>
                {pluralParticipants(n)}
              </button>
            ))}
          </div>
        ))}
      </div>

      {count && (
        <div style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
          <p style={{ color: "#e2e8f0", fontWeight: 700, margin: "0 0 4px" }}><i className="fa-solid fa-check-circle" style={{ color: "#a78bfa", marginRight: 8 }}></i>Вы выбрали: <span style={{ color: "#a78bfa" }}>{pluralParticipants(count)}</span></p>
          <p style={{ color: "#9ca3af", fontSize: "0.82rem", margin: 0 }}><i className="fa-solid fa-circle-info" style={{ marginRight: 6, color: "#6b7280" }}></i>Вы сможете пригласить ещё {pluralParticipants(count - 1)}</p>
        </div>
      )}

      {error && <p style={{ color: "#f43f5e", fontSize: "0.85rem", marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 12 }}>
        <button type="button" onClick={prevStep} style={{ flex: 1, padding: "13px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 600 }}>Назад</button>
        <button type="button" onClick={createRoom} disabled={!count || creating} style={{ flex: 2, padding: "13px", borderRadius: 12, background: count && !creating ? "linear-gradient(135deg,#8b5cf6,#7c3aed)" : "rgba(255,255,255,0.08)", border: "none", color: count && !creating ? "white" : "#6b7280", cursor: count && !creating ? "pointer" : "not-allowed", fontWeight: 700, fontSize: "1rem" }}>
          {creating ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Создание...</> : <><i className="fa-solid fa-users" style={{ marginRight: 8 }}></i>Создать группу</>}
        </button>
      </div>
    </div>
  );
}