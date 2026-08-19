import { Link } from "react-router-dom";
import { AuthShell } from "./Login";

export default function Forbidden() { return <AuthShell title="Нет доступа" subtitle="У вашей учётной записи нет прав для просмотра этой страницы."><Link to="/" style={{ display: "inline-flex", padding: "11px 18px", borderRadius: 10, background: "linear-gradient(135deg,#0891b2,#7c3aed)", color: "white", textDecoration: "none", fontWeight: 700 }}>На главную</Link></AuthShell>; }
