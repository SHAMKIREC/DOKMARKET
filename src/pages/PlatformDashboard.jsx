import { Link } from "react-router-dom";
import Dashboard from "./Dashboard";

const sections = [
  { to: "/MyDocuments", icon: "fa-folder-open", title: "Мои документы", text: "Документы, созданные умными сервисами" },
  { to: "/#services", icon: "fa-wand-magic-sparkles", title: "Умные сервисы", text: "Досудебка и следующие автоматизации" },
  { to: "/market/cart", icon: "fa-cart-shopping", title: "Корзина", text: "Документы, сервисы и услуги" },
  { to: "/market/favorites", icon: "fa-heart", title: "Избранное", text: "Сохранённые материалы и специалисты" },
];

export default function PlatformDashboard() {
  return <div className="platform-dashboard-shell">
    <style>{`
      .platform-dashboard-nav{padding:94px 16px 0;background:radial-gradient(circle at 15% 0%,rgba(8,145,178,.12),transparent 30rem),#07111d;color:#e2e8f0}.platform-dashboard-inner{max-width:1080px;margin:0 auto}.platform-dashboard-brand{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:16px}.platform-dashboard-brand span{color:#67e8f9;font-size:.7rem;font-weight:850;text-transform:uppercase;letter-spacing:.12em}.platform-dashboard-brand h1{margin:5px 0 0;color:#fff;font:800 clamp(1.35rem,3vw,1.8rem) 'Space Grotesk',sans-serif}.platform-dashboard-brand>a{color:#a5f3fc;text-decoration:none;font-size:.78rem;font-weight:750}.platform-dashboard-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.platform-dashboard-tab{display:flex;align-items:center;gap:10px;padding:12px;border-radius:13px;color:#e2e8f0;text-decoration:none;background:rgba(15,23,42,.62);border:1px solid rgba(103,232,249,.11);transition:.2s}.platform-dashboard-tab:hover{border-color:rgba(103,232,249,.3);transform:translateY(-1px)}.platform-dashboard-tab i{width:32px;height:32px;display:grid;place-items:center;border-radius:9px;color:#67e8f9;background:rgba(8,145,178,.1)}.platform-dashboard-tab div{display:grid;gap:2px}.platform-dashboard-tab b{font-size:.77rem;color:#fff}.platform-dashboard-tab small{font-size:.64rem;color:#64748b}@media(max-width:760px){.platform-dashboard-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}.platform-dashboard-brand{align-items:flex-start;flex-direction:column}}@media(max-width:430px){.platform-dashboard-tabs{grid-template-columns:1fr}}
    `}</style>
    <section className="platform-dashboard-nav">
      <div className="platform-dashboard-inner">
        <div className="platform-dashboard-brand"><div><span><i className="fa-solid fa-cubes" /> ДокМаркет</span><h1>Единый личный кабинет</h1></div><Link to="/">← На главную ДокМаркета</Link></div>
        <nav className="platform-dashboard-tabs" aria-label="Разделы личного кабинета">{sections.map(item => <Link className="platform-dashboard-tab" to={item.to} key={item.to}><i className={`fa-solid ${item.icon}`} /><div><b>{item.title}</b><small>{item.text}</small></div></Link>)}</nav>
      </div>
    </section>
    <div style={{marginTop:-76}}><Dashboard /></div>
  </div>;
}
