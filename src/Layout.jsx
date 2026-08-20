import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import logoDosudebka from "@/assets/logo-dosudebka.png";

export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isLawyer = user?.role === "lawyer";
  const isMarketplace = pathname.toLowerCase().startsWith("/market") || pathname === "/";

  return (
    <div className="app-shell" style={{ fontFamily: "'Inter', sans-serif", color: "#e2e8f0", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; background: #07111d; }
        .app-shell { background-color:#07111d; background-image:radial-gradient(circle at 18% 0%,rgba(8,145,178,.15),transparent 34rem),radial-gradient(circle at 82% 4%,rgba(124,58,237,.14),transparent 32rem),radial-gradient(circle at 50% 55%,rgba(67,56,202,.045),transparent 42rem); background-attachment:fixed; }
        .nav-link { color:#cbd5e1; font-size:.9rem; font-weight:600; text-decoration:none; transition:.2s; cursor:pointer; background:none; border:none; padding:7px 4px; border-radius:8px; white-space:nowrap; }
        .nav-link:hover { color:#67e8f9; } .nav-link.active { color:#a5f3fc; }
        .mobile-menu { display:none; } .desktop-nav { display:flex; } .burger-btn { display:none; }
        .brand-logo-link { display:flex; align-items:center; flex-shrink:0; text-decoration:none; gap:12px; }
        .brand-logo-image { display:block; width:auto; height:58px; max-width:285px; object-fit:contain; }
        .platform-pill { display:inline-flex; align-items:center; gap:6px; padding:5px 9px; border-radius:999px; color:#a5f3fc; border:1px solid rgba(103,232,249,.22); background:rgba(8,145,178,.10); font-size:.66rem; font-weight:800; white-space:nowrap; }
        @media(max-width:640px){ .desktop-nav{display:none!important}.burger-btn{display:flex!important}.mobile-menu{display:flex}.header-inner{min-height:60px!important}.brand-logo-image{height:42px;max-width:190px}.platform-pill{display:none} }
      `}</style>

      {!isMarketplace && <nav style={{ position:"fixed",top:0,left:0,width:"100%",zIndex:50,background:"rgba(7,17,29,.96)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(103,232,249,.11)" }}>
        <div className="header-inner" style={{ maxWidth:"1380px",margin:"0 auto",padding:"0 1.25rem",display:"flex",justifyContent:"space-between",alignItems:"center",minHeight:"76px" }}>
          <Link to="/dosudebka" className="brand-logo-link" aria-label="Досудебка — умный сервис ДокМаркет" onClick={() => setMenuOpen(false)}>
            <img src={logoDosudebka} alt="Досудебка" className="brand-logo-image" />
            <span className="platform-pill"><i className="fa-solid fa-cubes" />умный сервис ДокМаркет</span>
          </Link>
          <div className="desktop-nav" style={{ alignItems:"center",gap:"clamp(13px,1.5vw,22px)",marginLeft:24 }}>
            <Link to="/" className="nav-link"><i className="fa-solid fa-grid-2" style={{marginRight:6}} />ДокМаркет</Link>
            <Link to="/dosudebka" className={`nav-link ${currentPageName === "Dosudebka" || currentPageName === "Home" ? "active" : ""}`}>Досудебка</Link>
            <Link to={createPageUrl("Generator")} className={`nav-link ${currentPageName === "Generator" ? "active" : ""}`}>Создать претензию</Link>
            <Link to={createPageUrl("Guide")} className={`nav-link ${currentPageName === "Guide" ? "active" : ""}`}>Как работает</Link>
            <Link to={createPageUrl("Pricing")} className={`nav-link ${currentPageName === "Pricing" ? "active" : ""}`}>Тарифы</Link>
            <Link to="/market/cart" className="nav-link"><i className="fa-solid fa-cart-shopping" /> Корзина</Link>
            {isLawyer ? <Link to={createPageUrl("BusinessCabinet")} className="nav-link" style={{color:"#c4b5fd"}}><i className="fa-solid fa-building" /> Кабинет</Link> : <Link to={createPageUrl("Dashboard")} className="nav-link" style={{color:"#67e8f9"}}><i className="fa-solid fa-user" /> Кабинет</Link>}
          </div>
          <button className="burger-btn" onClick={() => setMenuOpen(o=>!o)} style={{background:"none",border:"none",color:"white",fontSize:"1.4rem",cursor:"pointer",alignItems:"center",justifyContent:"center",padding:4}} aria-label="Меню"><i className={menuOpen?"fa-solid fa-xmark":"fa-solid fa-bars"} /></button>
        </div>
        {menuOpen && <div className="mobile-menu" style={{flexDirection:"column",background:"rgba(7,17,29,.99)",borderTop:"1px solid rgba(255,255,255,.07)",padding:"8px 0 12px"}}>
          {[{label:"ДокМаркет",to:"/",page:"Market"},{label:"Досудебка",to:"/dosudebka",page:"Dosudebka"},{label:"Создать претензию",page:"Generator"},{label:"Как работает",page:"Guide"},{label:"Тарифы",page:"Pricing"},{label:"Корзина",to:"/market/cart",page:"Cart"},{label:isLawyer?"Бизнес-кабинет":"Личный кабинет",page:isLawyer?"BusinessCabinet":"Dashboard"}].map(item=><Link key={item.label} to={item.to||createPageUrl(item.page)} className="nav-link" onClick={()=>setMenuOpen(false)} style={{display:"block",padding:"14px 24px",fontSize:"1rem",borderBottom:"1px solid rgba(255,255,255,.05)"}}>{item.label}</Link>)}
        </div>}
      </nav>}
      <main>{children}</main>
    </div>
  );
}