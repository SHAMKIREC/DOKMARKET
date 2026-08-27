import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import docmarketIcon from "../../assets/docmarket-icon.png";

function Icon({name,size=20}){
  const common={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.9,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":true};
  const icons={
    heart:<><path d="M20.3 5.8a5.1 5.1 0 0 0-7.2 0L12 6.9l-1.1-1.1a5.1 5.1 0 0 0-7.2 7.2L12 21l8.3-8a5.1 5.1 0 0 0 0-7.2Z"/></>,
    bag:<><path d="M5.2 8.7h13.6l1.1 11.8H4.1L5.2 8.7Z"/><path d="M8.6 9V7.2a3.4 3.4 0 0 1 6.8 0V9"/></>,
    user:<><circle cx="12" cy="7.7" r="3.7"/><path d="M5.1 20.4v-.9a6.9 6.9 0 0 1 13.8 0v.9"/></>,
    store:<><rect x="4" y="4" width="6.2" height="6.2" rx="1.5"/><rect x="13.8" y="4" width="6.2" height="6.2" rx="1.5"/><rect x="4" y="13.8" width="6.2" height="6.2" rx="1.5"/><rect x="13.8" y="13.8" width="6.2" height="6.2" rx="1.5"/></>,
    home:<><path d="m3.7 10.8 8.3-7.1 8.3 7.1"/><path d="M5.7 9.7v10.6h12.6V9.7M9.3 20.3v-6.1h5.4v6.1"/></>,
    docs:<><path d="M7.2 3.4h8.2l3.4 3.4v13.8H7.2z"/><path d="M15.4 3.4v4.2h4.2M10.2 11.2h5.6M10.2 14.6h5.6"/></>,
    users:<><circle cx="8.5" cy="8.7" r="3.3"/><circle cx="16.7" cy="9.7" r="2.8"/><path d="M2.7 20.6c.5-4.7 2.5-7.2 5.8-7.2s5.3 2.5 5.8 7.2M14.2 14.3c3.9.1 6.1 2.2 6.7 6.3"/></>,
    services:<><path d="M12 3.2 9.7 8.5 4.4 11l5.3 2.4L12 18.8l2.4-5.4 5.3-2.4-5.3-2.5L12 3.2Z"/><path d="M5 3.8v4M3 5.8h4M19 16.3v4M17 18.3h4"/></>,
    info:<><circle cx="12" cy="12" r="9"/><path d="M12 10.7v6.1M12 7.2h.01"/></>,
    help:<><circle cx="12" cy="12" r="9"/><path d="M9.6 9.1a2.6 2.6 0 1 1 3.8 2.3c-.9.5-1.4 1.1-1.4 2.3M12 17.2h.01"/></>,
    close:<path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8"/>,
    menu:<><path d="M4.2 7.2h15.6M4.2 12h15.6M4.2 16.8h15.6"/></>
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
  return <nav className="dm-global-bottom" aria-label="Основная навигация">{items.map(([to,icon,label,active])=><Link className={active?"active":""} to={to} key={label}><span className="dm-bottom-icon"><Icon name={icon} size={20}/></span><span>{label}</span></Link>)}</nav>;
}

export default function DocMarketHeader(){
  const {user}=useAuth();
  const {pathname}=useLocation();
  const [menuOpen,setMenuOpen]=useState(false);
  useEffect(()=>setMenuOpen(false),[pathname]);
  useEffect(()=>{
    if(!menuOpen)return;
    const old=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=old};
  },[menuOpen]);
  const close=()=>setMenuOpen(false);

  const menuItems=[
    ["/market","store","Каталог","Документы и шаблоны"],
    [user?"/Dashboard":"/Login","user",user?"Личный кабинет":"Войти",user?"Заказы и документы":"Войти в аккаунт"],
    ["/dosudebka","docs","Досудебка","Составить претензию"],
    ["/#services","services","Сервисы","Инструменты ДокМаркета"],
    ["/partners","users","Партнёры","Сотрудничество"],
    ["/seller","store","Стать селлером","Размещать документы"],
    ["/about","info","О ДокМаркете","Как работает платформа"],
    ["/support","help","Помощь","Поддержка и ответы"]
  ];

  return <>
    <style>{`
      .dm-global-bottom{display:none}
      .docmarket-mobile-backdrop{display:none}
      @media(max-width:760px){
        body{padding-bottom:calc(62px + env(safe-area-inset-bottom))}
        .dm-global-bottom{position:fixed;z-index:1000;left:10px;right:10px;bottom:max(7px,env(safe-area-inset-bottom));height:52px;padding:3px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));background:rgba(7,17,29,.97);border:1px solid #2c3d49;border-radius:15px;box-shadow:0 10px 28px rgba(0,0,0,.46);backdrop-filter:blur(16px)}
        .dm-global-bottom a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-width:0;border-radius:10px;color:#8391a1;text-decoration:none;font-size:.49rem;line-height:1;font-weight:800}
        .dm-global-bottom a.active{color:#efb45e;background:#1b160f;border:1px solid #604625}
        .dm-bottom-icon{width:22px;height:21px;display:grid;place-items:center}.dm-global-bottom svg{width:18px;height:18px}.dm-mobile-bottom{display:none!important}
        .docmarket-mobile-backdrop{display:block;position:fixed;z-index:1040;inset:58px 0 0;background:rgba(2,7,12,.72);backdrop-filter:blur(4px)}
        .docmarket-mobile-menu{position:fixed!important;z-index:1050!important;top:64px!important;left:10px!important;right:10px!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;max-height:calc(100dvh - 138px)!important;overflow:auto!important;padding:10px!important;border:1px solid #2c4050!important;border-radius:16px!important;background:#081521f7!important;box-shadow:0 20px 55px rgba(0,0,0,.58)!important}
        .docmarket-mobile-menu a{min-height:62px!important;display:grid!important;grid-template-columns:34px 1fr!important;grid-template-rows:auto auto!important;column-gap:8px!important;align-items:center!important;padding:8px 9px!important;border-radius:12px!important;border:1px solid #263947!important;background:#0c1823!important;color:#eef2f6!important;text-decoration:none!important}
        .docmarket-mobile-menu a svg{grid-row:1/3!important;width:23px!important;height:23px!important;color:#d49a50!important;align-self:center!important}
        .docmarket-mobile-menu a strong{font-size:.69rem!important;line-height:1.12!important}.docmarket-mobile-menu a small{font-size:.54rem!important;line-height:1.15!important;color:#7f8d9c!important;margin-top:2px!important}
      }
      @media(max-width:400px){.docmarket-mobile-menu{grid-template-columns:1fr!important}.docmarket-mobile-menu a{min-height:54px!important}}
    `}</style>
    <header className="docmarket-header">
      <div className="docmarket-header-inner">
        <DocMarketBrand/>
        <nav className="docmarket-main-nav"><Link to="/market">Каталог</Link><Link to="/#verified-sellers">Селлеры</Link><Link to="/partners">Партнёры</Link><Link to="/reviews">Отзывы</Link><Link to="/seller">Стать селлером</Link></nav>
        <nav className="docmarket-actions">
          <Link to={user?"/Dashboard":"/Login"} aria-label={user?"Кабинет":"Войти"}><Icon name="user"/><span>{user?"Кабинет":"Войти"}</span></Link>
          <button className="docmarket-menu-button" type="button" aria-expanded={menuOpen} aria-label={menuOpen?"Закрыть меню":"Открыть меню"} onClick={()=>setMenuOpen(v=>!v)}><Icon name={menuOpen?"close":"menu"}/></button>
        </nav>
      </div>
    </header>
    {menuOpen&&<><button className="docmarket-mobile-backdrop" type="button" aria-label="Закрыть меню" onClick={close}/><div className="docmarket-mobile-menu">{menuItems.map(([to,icon,title,subtitle])=><Link to={to} onClick={close} key={`${to}-${title}`}><Icon name={icon}/><strong>{title}</strong><small>{subtitle}</small></Link>)}</div></>}
    <DocMarketBottomNav/>
  </>;
}
