import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import docmarketIcon from "../../assets/docmarket-icon.png";

function Icon({ name }) {
  const common = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (name === "heart") return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>;
  if (name === "bag") return <svg {...common}><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>;
  if (name === "user") return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
  if (name === "store") return <svg {...common}><path d="M3 10h18"/><path d="M5 10v10h14V10"/><path d="m4 4-1 6h18l-1-6H4Z"/><path d="M9 14h6v6H9z"/></svg>;
  if (name === "users") return <svg {...common}><path d="M8 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 12a3 3 0 1 0 0-6"/><path d="M2 21c0-4 2-6 6-6s6 2 6 6M15 16c4 0 6 2 7 5"/></svg>;
  if (name === "close") return <svg {...common}><path d="M6 6l12 12M18 6 6 18"/></svg>;
  return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
}

export function DocMarketBrand() {
  return <Link className="docmarket-brand" to="/" aria-label="ДокМаркет — на главную">
    <img className="docmarket-brand-icon" src={docmarketIcon} alt="" aria-hidden="true" />
    <span className="docmarket-brand-copy"><strong><span>Док</span><em>Маркет</em></strong><small>Маркетплейс документов</small></span>
  </Link>;
}

export default function DocMarketHeader() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return <header className="docmarket-header">
    <div className="docmarket-header-inner">
      <DocMarketBrand />
      <nav className="docmarket-main-nav" aria-label="Навигация ДокМаркета">
        <Link to="/market" onClick={close}>Каталог</Link>
        <Link to="/#verified-sellers" onClick={close}>Специалисты</Link>
        <Link to="/partners" onClick={close}>Партнёры</Link>
        <Link to="/reviews" onClick={close}>Отзывы</Link>
        <Link to="/seller" onClick={close}>Стать селлером</Link>
      </nav>
      <nav className="docmarket-actions" aria-label="Действия ДокМаркета">
        <Link to="/market/favorites" title="Избранное" aria-label="Избранное"><Icon name="heart"/><span>Избранное</span></Link>
        <Link to="/market/cart" title="Корзина" aria-label="Корзина"><Icon name="bag"/><span>Корзина</span></Link>
        <Link to={user ? "/Dashboard" : "/Login"} title={user ? "Кабинет" : "Войти"} aria-label={user ? "Кабинет" : "Войти"}><Icon name="user"/><span>{user ? "Кабинет" : "Войти"}</span></Link>
        <button className="docmarket-menu-button" type="button" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}><Icon name={menuOpen ? "close" : "menu"}/></button>
      </nav>
    </div>
    {menuOpen && <div className="docmarket-mobile-menu">
      <Link to="/market" onClick={close}><Icon name="store"/>Каталог документов</Link>
      <Link to="/market/favorites" onClick={close}><Icon name="heart"/>Избранное</Link>
      <Link to="/market/cart" onClick={close}><Icon name="bag"/>Корзина</Link>
      <Link to={user ? "/Dashboard" : "/Login"} onClick={close}><Icon name="user"/>{user ? "Личный кабинет" : "Войти"}</Link>
      <Link to="/seller" onClick={close}><Icon name="store"/>Стать селлером</Link>
      <Link to="/partners" onClick={close}><Icon name="users"/>Партнёры</Link>
      <Link to="/construction-docs" onClick={close}><Icon name="store"/>Строительная документация</Link>
    </div>}
  </header>;
}
