import { Link, useLocation } from "react-router-dom";
import DocMarketHeader from "@/marketplace/components/DocMarketBrand";

function GavelIcon(){return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 4 6 6M12 6l6 6M5 15l7-7 4 4-7 7H5v-4ZM3 21h12"/></svg>}
function NavIcon({type}){const p={viewBox:"0 0 24 24",width:20,height:20,fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":true};const paths={home:<><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10"/></>,search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></>,services:<><path d="M12 3.2 9.7 8.5 4.4 11l5.3 2.4L12 18.8l2.4-5.4 5.3-2.4-5.3-2.5L12 3.2Z"/><path d="M5 3.8v4M3 5.8h4M19 16.3v4M17 18.3h4"/></>,heart:<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>,bag:<><path d="M5.2 8.7h13.6l1.1 11.8H4.1L5.2 8.7Z"/><path d="M8.6 9V7.2a3.4 3.4 0 0 1 6.8 0V9"/><path d="M8 13h8" opacity=".55"/></>};return <svg {...p}>{paths[type]}</svg>}

export default function Layout({ children, currentPageName }) {
  const { pathname, hash } = useLocation();
  const lowerPath = pathname.toLowerCase();
  const alreadyHasMarketFrame = lowerPath.startsWith("/market") || pathname === "/" || lowerPath === "/reviews";
  const isDosudebkaArea = ["/dosudebka", "/generator", "/guide", "/pricing"].some(prefix => lowerPath.startsWith(prefix)) || ["Home","Dosudebka","Generator","Guide","Pricing"].includes(currentPageName);
  const mobileLinks=[
    ["/","Главная","home",pathname==="/"&&!hash],
    ["/market","Каталог","search",lowerPath.startsWith("/market")&&!lowerPath.startsWith("/market/favorites")&&!lowerPath.startsWith("/market/cart")],
    ["/#services","Сервисы","services",pathname==="/"&&hash==="#services"],
    ["/market/favorites","Избранное","heart",lowerPath.startsWith("/market/favorites")],
    ["/market/cart","Корзина","bag",lowerPath.startsWith("/market/cart")],
  ];
  return <div className={`app-shell dm-app-shell${isDosudebkaArea ? " dm-dosudebka-area" : ""}`}>
    {!alreadyHasMarketFrame && <DocMarketHeader />}
    {isDosudebkaArea && !alreadyHasMarketFrame && <nav className="dm-service-nav" aria-label="Досудебка — сервис ДокМаркета"><div className="dm-service-nav-inner">
      <Link className="dm-service-home" to="/dosudebka"><span className="dm-service-symbol"><GavelIcon/></span><span><strong>Досудебка</strong><small>сервис ДокМаркета</small></span></Link>
      <div className="dm-service-links"><Link className={currentPageName==="Generator"?"active":""} to="/Generator">Создать</Link><Link className={currentPageName==="Guide"?"active":""} to="/Guide">Как работает</Link><Link className={currentPageName==="Pricing"?"active":""} to="/Pricing">Цена</Link></div>
    </div></nav>}
    <main>{children}</main>
    {!alreadyHasMarketFrame && <nav className="dm-global-mobile-nav" aria-label="Навигация ДокМаркета">{mobileLinks.map(([to,label,icon,active])=><Link className={active?"active":""} key={to} to={to}><NavIcon type={icon}/><span>{label}</span></Link>)}</nav>}
    <style>{`
      .dm-global-mobile-nav{display:none}
      @media(max-width:760px){.dm-app-shell main{padding-bottom:64px}.dm-global-mobile-nav{position:fixed;left:0;right:0;bottom:0;z-index:95;height:62px;padding:5px 6px calc(5px + env(safe-area-inset-bottom));background:#07111df7;border-top:1px solid #1c3040;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:start}.dm-global-mobile-nav a{color:#718297;text-decoration:none;display:grid;place-items:center;gap:2px;font-size:.5rem;min-width:0}.dm-global-mobile-nav a.active{color:#ff9f1c}.dm-global-mobile-nav svg{width:20px;height:20px}}
    `}</style>
  </div>;
}
