import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRoom, getTotalParticipants } from "@/services/collectiveService";

export default function JoinRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [room, setRoom] = useState(null);

  useEffect(() => {
    if (!roomId) { setStatus("error"); return; }
    void loadRoom();
  }, [roomId]);

  async function loadRoom() {
    setStatus("loading");
    try {
      const currentRoom = await getRoom(roomId);
      if (!currentRoom) { setStatus("error"); return; }
      setRoom(currentRoom);
      setStatus(currentRoom.collectiveFinalized ? "closed" : "join");
    } catch {
      setStatus("error");
    }
  }

  function handleJoin() {
    localStorage.setItem("legalpro_join_room", roomId);
    navigate(`/Generator?room=${encodeURIComponent(roomId)}`);
  }

  const boxStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 36, maxWidth: 460, width: "100%", margin: "0 auto" };

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;
  if (status === "error") return <div className="min-h-screen pt-24 flex items-center justify-center px-4"><div style={boxStyle} className="text-center"><h2 style={{ fontWeight: 800, color: "white", fontSize: "1.4rem", marginBottom: 8 }}>Комната не найдена или ссылка устарела.</h2><Link to="/Generator" style={{ color: "#22d3ee", fontSize: ".9rem" }}>Создать новую претензию</Link></div></div>;
  if (status === "closed") return <div className="min-h-screen pt-24 flex items-center justify-center px-4"><div style={boxStyle} className="text-center"><h2 style={{ fontWeight: 800, color: "white", fontSize: "1.5rem", marginBottom: 10 }}>Совместная претензия уже сформирована</h2><p style={{ color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>Организатор завершил сбор данных. Новые участники больше не добавляются.</p></div></div>;

  const total = getTotalParticipants(room);
  return <div className="min-h-screen pt-24 flex items-center justify-center px-4"><div style={boxStyle}><div style={{ textAlign: "center", marginBottom: 24 }}><h2 style={{ fontWeight: 800, color: "white", fontSize: "1.5rem", marginBottom: 6 }}>Совместная претензия</h2><p style={{ color: "#94a3b8", fontSize: ".9rem" }}>Вас пригласили заполнить данные участника</p></div><div style={{ background: "rgba(139,92,246,.1)", border: "1px solid rgba(139,92,246,.25)", borderRadius: 12, padding: 16, marginBottom: 24 }}><p style={{ color: "#d1d5db", fontSize: ".9rem", marginBottom: 6 }}><b style={{ color: "white" }}>Ответчик:</b> {room?.employer?.name || "будет указан организатором"}</p><p style={{ color: "#94a3b8", fontSize: ".82rem", margin: 0 }}>Мест в группе: {total}</p></div><p style={{ color: "#cbd5e1", fontSize: ".88rem", lineHeight: 1.65, marginBottom: 24 }}>Место закрепится за вами только после нажатия кнопки ниже. Простое открытие ссылки не занимает слот. Ваши данные сохранятся в защищённой серверной комнате и станут доступны организатору.</p><button onClick={handleJoin} style={{ width: "100%", padding: 14, borderRadius: 12, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", border: "none", color: "white", fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}>Заполнить мои данные</button></div></div>;
}