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
  const isMarketplace = pathname.toLowerCase().startsWith("/market");

  return (
    <div className="app-shell" style={{ fontFamily: "'Inter', sans-serif", color: "#e2e8f0", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; background: #080910; }
        .app-shell {
          background-color: #080910;
          background-image:
            radial-gradient(circle at 18% 0%, rgba(37, 99, 235, 0.13), transparent 34rem),
            radial-gradient(circle at 82% 4%, rgba(124, 58, 237, 0.14), transparent 32rem),
            radial-gradient(circle at 50% 55%, rgba(67, 56, 202, 0.045), transparent 42rem);
          background-attachment: fixed;
        }
        .nav-link { color: #cbd5e1; font-size: 0.9rem; font-weight: 500; text-decoration: none; transition: color 0.2s, background-color 0.2s; cursor: pointer; background: none; border: none; padding: 7px 4px; border-radius: 8px; white-space: nowrap; }
        .nav-link:hover { color: #a5f3fc; }
        .nav-link.active { color: #c4b5fd; }
        .pro-btn { color: #fbbf24; font-size: 0.875rem; font-weight: 500; background: none; border: none; cursor: pointer; transition: color 0.2s; }
        .pro-btn:hover { color: #fde68a; }
        .mobile-menu { display: none; }
        .desktop-nav { display: flex; }
        .burger-btn { display: none; }
        .brand-logo-link {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          overflow: visible;
          padding: 0;
          border: none;
          background: transparent;
          box-shadow: none;
          text-decoration: none;
        }
        .brand-logo-image {
          display: block;
          width: auto;
          height: 64px;
          max-width: 320px;
          object-fit: contain;
        }
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .burger-btn { display: flex !important; }
          .mobile-menu { display: flex; }
          .header-inner { min-height: 60px !important; }
          .brand-logo-image { width: auto; height: 44px; max-width: 220px; object-fit: contain; }
        }
      `}</style>

      {!isMarketplace && <nav style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 50, background: "rgba(10,10,15,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="header-inner" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "76px", overflow: "visible" }}>
          <Link to="/" className="brand-logo-link" aria-label="Досудебка — на главную" onClick={() => setMenuOpen(false)}>
            <img src={logoDosudebka} alt="Досудебка" className="brand-logo-image" />
          </Link>

          {/* Desktop nav */}
          <div className="desktop-nav" style={{ alignItems: "center", gap: "clamp(14px, 1.8vw, 24px)", marginLeft: 24 }}>
            <Link to="/" className={`nav-link ${currentPageName === "Home" ? "active" : ""}`}>Главная</Link>
            <Link to="/market" className={`nav-link ${currentPageName === "Market" ? "active" : ""}`}>ДокМаркет</Link>
            <Link to={createPageUrl("Generator")} className={`nav-link ${currentPageName === "Generator" ? "active" : ""}`}>Генератор</Link>
            <Link to={createPageUrl("Pricing")} className={`nav-link ${currentPageName === "Pricing" ? "active" : ""}`}>Тарифы</Link>
            <Link to={createPageUrl("Guide")} className={`nav-link ${currentPageName === "Guide" ? "active" : ""}`}>Инструкция</Link>
            <Link to={createPageUrl("ForLawyers")} className={`nav-link ${currentPageName === "ForLawyers" ? "active" : ""}`}>Для юристов</Link>
            {isLawyer ? (
              <Link to={createPageUrl("BusinessCabinet")} className="nav-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a855f7" }}>
                <i className="fa-solid fa-building"></i> Бизнес-кабинет
              </Link>
            ) : (
              <Link to={createPageUrl("Dashboard")} className="nav-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)", color: "#22d3ee" }}>
                <i className="fa-solid fa-user"></i> Кабинет
              </Link>
            )}
          </div>

          {/* Burger */}
          <button className="burger-btn" onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", color: "white", fontSize: "1.4rem", cursor: "pointer", alignItems: "center", justifyContent: "center", padding: 4 }}>
            <i className={menuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}></i>
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="mobile-menu" style={{ flexDirection: "column", gap: 0, background: "rgba(10,10,15,0.99)", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "8px 0 12px" }}>
            {[
              { label: "Главная", page: "Home", to: "/" },
              { label: "ДокМаркет", page: "Market", to: "/market" },
              { label: "Генератор", page: "Generator" },
              { label: "Тарифы", page: "Pricing" },
              { label: "Инструкция", page: "Guide" },
              { label: "Для юристов", page: "ForLawyers" },
              { label: isLawyer ? "Бизнес-кабинет" : "Личный кабинет", page: isLawyer ? "BusinessCabinet" : "Dashboard" },
            ].map(item => (
              <Link key={item.page} to={item.to || createPageUrl(item.page)} className="nav-link" onClick={() => setMenuOpen(false)}
                style={{ display: "block", padding: "14px 24px", fontSize: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>}

      <main>{children}</main>

    </div>
  );
}
