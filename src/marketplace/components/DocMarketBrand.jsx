import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import docmarketIcon from "../../assets/docmarket-icon.png";

function Icon({name,size=20}){
  const common={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.9,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":true};
  const icons={
    heart:<><path d="M20.3 5.8a5.1 5.1 0 0 0-7.2 0L12 6.9l-1.1-1.1a5.1 5.1 0 0 0-7.2 7.2L12 21l8.3-8a5.1 5.1 0 0 0 0-7.2Z"/><path d="M6.4 8.1c.7-.8 1.9-1 2.8-.4" opacity=".55"/></>,
    bag:<><path d="M5.2 8.7h13.6l1.1 11.8H4.1L5.2 8.7Z"/><path d="M8.6 9V7.2a3.4 3.4 0 0 1 6.8 0V9"/><path d="M8 13h8" opacity=".55"/></>,
    user:<><circle cx="12" cy="7.7" r="3.7"/><path d="M5.1 20.4v-.9a6.9 6.9 0 0 1 13.8 0v.9"/><path d="M8.5 16.2c1-.7 2.2-1.1 3.5-1.1s2.5.4 3.5 1.1" opacity=".55"/></>,
    store:<><rect x="4" y="4" width="6.2" height="6.2" rx="1.5"/><rect x="13.8" y="4" width="6.2" height="6.2" rx="1.5"/><rect x="4" y="13.8" width="6.2" height="6.2" rx="1.5"/><rect x="13.8" y="13.8" width="6.2" height="6.2" rx="1.5"/></>,
    home:<><path d="m3.7 10.8 8.3-7.1 8.3 7.1"/><path d="M5.7 9.7v10.6h12.6V9.7M9.3 20.3v-6.1h5.4v6.1"/><path d="M8.2 10.8h7.6" opacity=".5"/></>,
    docs:<><path d="M7.2 3.4h8.2l3.4 3.4v13.8H7.2z"/><path d="M15.4 3.4v4.2h4.2M10.2 11.2h5.6M10.2 14.6h5.6"/><path d="M4.4 7.2v13.4h10.2" opacity=".55"/></>,
    users:<><circle cx="8.5" cy="8.7" r="3.3"/><circle cx="16.7" cy="9.7" r="2.8"/><path d="M2.7 20.6c.5-4.7 2.5-7.2 5.8-7.2s5.3 2.5 5.8 7.2M14.2 14.3c3.9.1 6.1 2.2 6.7 6.3"/></>,
    services:<><path d="M12 3.2 9.7 8.5 4.4 11l5.3 2.4L12 18.8l2.4-5.4 5.3-2.4-5.3-2.5L12 3.2Z"/><path d="M5 3.8v4M3 5.8h4M19 16.3v4M17 18.3h4"/></>,
    info:<><circle cx="12" cy="12" r="9"/><path d="M12 10.7v6.1M12 7.2h.01"/></>,
    help:<><circle cx="12" cy="12" r="9"/><path d="M9.6 9.1a2.6 2.6 0 1 1 3.8 2.3c-.9.5-1.4 1.1-1.4 2.3M12 17.2h.01"/></>,
    close:<path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8"/>,
    menu:<><path d="M4.2 7.2h15.6M4.2 12h15.6M4.2 16.8h15.6"/><circle cx="4.2" cy="7.2" r=".5" fill="currentColor" stroke="none"/></>
  };
  return <svg {...common}>{icons[name]||icons.menu}</svg>;
}

export function DocMarketBrand(){
  return <Link className="docmarket-brand" to="/" aria-label="ДокМаркет — на главную">
    <img className="docmarket-brand-icon" src={docmarketIcon} alt=""/>
    <span className="docmarket-brand-copy"><strong><span>Док</span><em>Маркет</em></strong><small>Маркетплейс документов</small></span>
  </Link>;
}

export function DocMarketBottomNav(){
  const {pathname}=useLocation();
  const items=[
    ["/","home","Главная",pathname==="/"],
    ["/market","store","Каталог",pathname==="/market"||pathname.startsWith("/market/offer")],
    ["/MyDocuments","docs","Документы",pathname.startsWith("/MyDocuments")],
    ["/market/favorites","heart","Избранное",pathname.startsWith("/market/favorites")],
    ["/market/cart","bag","Корзина",pathname.startsWith("/market/cart")]
  ];
  return <nav className="dm-global-bottom" aria-label="Основная навигация">
    {items.map(([to,icon,label,active])=><Link className={active?"active":""} to={to} key={label}><span className="dm-bottom-icon"><Icon name={icon} size={21}/></span><span>{label}</span></Link>)}
  </nav>;
}

export default function DocMarketHeader(){
  const {user}=useAuth();
  const [menuOpen,setMenuOpen]=useState(false);
  const close=()=>setMenuOpen(false);
  return <>
    <style>{`
      .dm-global-bottom{display:none}
      @media(max-width:760px){
        body{padding-bottom:calc(70px + env(safe-area-inset-bottom))}
        .dm-global-bottom{position:fixed;z-index:1000;left:9px;right:9px;bottom:max(7px,env(safe-area-inset-bottom));height:56px;padding:4px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));background:rgba(7,17,29,.965);border:1px solid #3f3428;border-radius:17px;box-shadow:0 12px 32px rgba(0,0,0,.55);backdrop-filter:blur(16px)}
        .dm-global-bottom a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:0;border-radius:12px;color:#8794a4;text-decoration:none;font-size:.54rem;line-height:1;font-weight:800;transition:background .18s ease,color .18s ease,transform .18s ease}
        .dm-global-bottom a:active{transform:scale(.97)}
        .dm-global-bottom a.active{color:#f0b45d;background:linear-gradient(145deg,#2a2015,#17140f);border:1px solid #6f4d29;box-shadow:inset 0 1px rgba(255,255,255,.06),0 4px 12px rgba(0,0,0,.22)}
        .dm-bottom-icon{width:25px;height:24px;display:grid;place-items:center}
        .dm-global-bottom svg{width:21px;height:21px;display:block}
        .dm-mobile-bottom{display:none!important}
        .docmarket-mobile-menu a{color:#e9edf2}
        .docmarket-mobile-menu a svg{color:#d99a4b;flex:0 0 auto}
      }
    `}</style>
    <header className="docmarket-header">
      <div className="docmarket-header-inner">
        <DocMarketBrand/>
        <nav className="docmarket-main-nav">
          <Link to="/market">Каталог</Link>
          <Link to="/#verified-sellers">Селлеры</Link>
          <Link to="/partners">Партнёры</Link>
          <Link to="/reviews">Отзывы</Link>
          <Link to="/seller">Стать селлером</Link>
        </nav>
        <nav className="docmarket-actions">
          <Link to={user?"/Dashboard":"/Login"} aria-label={user?"Кабинет":"Войти"}><Icon name="user"/><span>{user?"Кабинет":"Войти"}</span></Link>
          <button className="docmarket-menu-button" type="button" aria-label={menuOpen?"Закрыть меню":"Открыть меню"} onClick={()=>setMenuOpen(v=>!v)}><Icon name={menuOpen?"close":"menu"}/></button>
        </nav>
      </div>
      {menuOpen&&<div className="docmarket-mobile-menu">
        <Link to="/market" onClick={close}><Icon name="store"/>Каталог документов</Link>
        <Link to={user?"/Dashboard":"/Login"} onClick={close}><Icon name="user"/>{user?"Личный кабинет":"Войти"}</Link>
        <Link to="/seller" onClick={close}><Icon name="store"/>Стать селлером</Link>
        <Link to="/partners" onClick={close}><Icon name="users"/>Партнёры</Link>
        <Link to="/#services" onClick={close}><Icon name="services"/>Сервисы</Link>
        <Link to="/dosudebka" onClick={close}><Icon name="docs"/>Досудебка</Link>
        <Link to="/about" onClick={close}><Icon name="info"/>О ДокМаркете</Link>
        <Link to="/support" onClick={close}><Icon name="help"/>Помощь и поддержка</Link>
      </div>}
    </header>
    <DocMarketBottomNav/>
  </>;
}
