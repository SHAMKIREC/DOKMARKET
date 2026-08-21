import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import docmarketIcon from "../../assets/docmarket-icon.png";

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
        <Link to="/market#specialists" onClick={close}>Продавцы</Link>
        <Link to="/reviews" onClick={close}>Отзывы</Link>
        <Link to="/ForLawyers" onClick={close}>Стать продавцом</Link>
      </nav>
      <nav className="docmarket-actions" aria-label="Действия ДокМаркета">
        <Link to="/market/favorites" title="Избранное" aria-label="Избранное"><i className="fa-regular fa-heart" /><span>Избранное</span></Link>
        <Link to="/market/cart" title="Корзина" aria-label="Корзина"><i className="fa-solid fa-bag-shopping" /><span>Корзина</span></Link>
        <Link to={user ? "/Dashboard" : "/Login"} title={user ? "Кабинет" : "Войти"} aria-label={user ? "Кабинет" : "Войти"}><i className="fa-regular fa-user" /><span>{user ? "Кабинет" : "Войти"}</span></Link>
        <button className="docmarket-menu-button" type="button" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}><i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`} /></button>
      </nav>
    </div>
    {menuOpen && <div className="docmarket-mobile-menu">
      <Link to="/market" onClick={close}><i className="fa-solid fa-store" />Каталог документов</Link>
      <Link to="/market/favorites" onClick={close}><i className="fa-regular fa-heart" />Избранное</Link>
      <Link to="/market/cart" onClick={close}><i className="fa-solid fa-bag-shopping" />Корзина</Link>
      <Link to={user ? "/Dashboard" : "/Login"} onClick={close}><i className="fa-regular fa-user" />{user ? "Личный кабинет" : "Войти"}</Link>
      <Link to="/ForLawyers" onClick={close}><i className="fa-solid fa-shop" />Стать продавцом</Link>
    </div>}
  </header>;
}
