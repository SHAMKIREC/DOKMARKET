import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function TemplateStudioGuard({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="fixed inset-0 flex items-center justify-center"><div className="w-9 h-9 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/Login" replace state={{ from: location }} />;

  // TODO: replace lawyer role with specialist verification model when DocMarket specialist accounts are implemented.
  if (user?.role !== "lawyer") return <div className="min-h-screen pt-28 pb-16 px-4">
    <section style={{ width: "min(680px,100%)", margin: "0 auto", padding: "clamp(24px,5vw,42px)", borderRadius: 24, textAlign: "center", background: "linear-gradient(145deg,rgba(20,29,50,.82),rgba(13,12,29,.86))", border: "1px solid rgba(148,163,184,.14)", boxShadow: "0 18px 50px rgba(0,0,0,.22)" }}>
      <span style={{ width: 54, height: 54, display: "grid", placeItems: "center", margin: "0 auto 18px", borderRadius: 16, color: "#67e8f9", background: "rgba(8,145,178,.1)", border: "1px solid rgba(103,232,249,.18)" }}><i className="fa-solid fa-user-shield" /></span>
      <h1 style={{ color: "#fff", fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(1.55rem,4vw,2.2rem)", margin: "0 0 12px" }}>Конструктор документов доступен специалистам</h1>
      <p style={{ color: "#94a3b8", lineHeight: 1.65, margin: "0 auto 24px", maxWidth: 560 }}>Создавать шаблоны и онлайн-формы для ДокМаркета могут только проверенные специалисты. Обычные пользователи могут выбирать готовые решения в каталоге и заполнять документы онлайн.</p>
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
        <Link to="/market" style={{ padding: "11px 15px", borderRadius: 10, color: "#fff", textDecoration: "none", fontWeight: 750, background: "linear-gradient(135deg,#0891b2,#7c3aed)" }}>Вернуться в ДокМаркет</Link>
        <Link to="/RegisterLawyer" style={{ padding: "11px 15px", borderRadius: 10, color: "#cbd5e1", textDecoration: "none", fontWeight: 750, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)" }}>Подать заявку специалиста</Link>
      </div>
    </section>
  </div>;

  return children;
}
