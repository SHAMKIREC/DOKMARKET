import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadPublishedCatalog } from "@/marketplace/services/catalogService";
import { listPublicSellers } from "@/marketplace/services/sellerProfileService";
import { MarketFrame } from "./Market";

const categories = [
  ["Юридические\nдокументы", "legal", "#ff9a3c", "scales"],
  ["Договоры", "contracts", "#9b5cff", "file"],
  ["Бухгалтерия", "accounting", "#49d17d", "calc"],
  ["Досудебка\n(претензии)", "dosudebka", "#ff9f1c", "gavel"],
  ["Бизнес\nи ИП", "business", "#4d7cff", "briefcase"],
  ["Кадры и HR", "hr", "#a95cff", "users"],
  ["Недвижимость", "realty", "#19c4b0", "home"],
  ["Авто", "auto", "#ff6948", "car"],
  ["Образование", "education", "#2b9cff", "cap"],
  ["Медицина", "medicine", "#25b99a", "medical"],
  ["Фриланс", "freelance", "#5877ff", "laptop"],
  ["Маркетплейсы\nи магазины", "marketplaces", "#ff5e8a", "cart"],
  ["Инструкции\nи гайды", "guides", "#ffad42", "book"],
  ["AI\nи технологии", "ai", "#25c9e8", "bot"],
  ["Чек-листы\nи шаблоны", "checklists", "#62ca72", "check"],
  ["Услуги\nспециалистов", "services", "#bd5bff", "specialist"],
];

const fallbackDocuments = [
  { id: "find-rent", title: "Договор аренды жилого помещения", formats: ["DOCX"], providerName: "Поиск по каталогу", previewOnly: true, actionUrl: "/market?q=договор%20аренды" },
  { id: "find-act", title: "Акт выполненных работ", formats: ["DOCX"], providerName: "Поиск по каталогу", previewOnly: true, actionUrl: "/market?q=акт%20выполненных%20работ" },
  { id: "find-claim", title: "Претензия на возврат денег", formats: ["PDF"], providerName: "Досудебка", previewOnly: true, actionUrl: "/dosudebka" },
  { id: "find-invoice", title: "Счёт на оплату для ИП и ООО", formats: ["XLSX"], providerName: "Поиск по каталогу", previewOnly: true, actionUrl: "/market?q=счет%20на%20оплату" },
];

const money = item => item.previewOnly ? "Подобрать" : item.priceType === "free" ? "Бесплатно" : `${item.priceType === "from" ? "от " : ""}${Number(item.price || 0).toLocaleString("ru-RU")} ₽`;
const initialsOf = name => String(name || "Продавец").split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join("").toUpperCase();

function LineIcon({ type, color = "currentColor", size = 40 }) {
  const p = { width: size, height: size, viewBox: "0 0 48 48", fill: "none", stroke: color, strokeWidth: 2.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (type === "heart") return <svg {...p}><path d="M40 12c-5-5-12-4-16 2-4-6-11-7-16-2-6 6-3 15 2 20l14 11 14-11c5-5 8-14 2-20Z"/></svg>;
  if (type === "bag") return <svg {...p}><path d="M12 17h24l2 24H10l2-24Z"/><path d="M18 17a6 6 0 0 1 12 0"/></svg>;
  if (type === "store") return <svg {...p}><path d="M7 18h34M10 18v22h28V18M9 8h30l2 10H7L9 8Z"/><path d="M18 29h12v11H18z"/></svg>;
  if (type === "search") return <svg {...p}><circle cx="21" cy="21" r="12"/><path d="m30 30 10 10"/></svg>;
  if (type === "home-nav") return <svg {...p}><path d="m8 22 16-14 16 14M13 20v20h22V20"/></svg>;
  if (type === "docs-nav") return <svg {...p}><rect x="11" y="7" width="26" height="34" rx="3"/><path d="M17 16h14M17 23h14M17 30h14"/></svg>;
  if (type === "user-nav") return <svg {...p}><circle cx="24" cy="16" r="7"/><path d="M11 40c1-9 6-14 13-14s12 5 13 14"/></svg>;
  if (type === "scales") return <svg {...p}><path d="M24 7v31M12 13h24M14 13 7 27h14L14 13Zm20 0-7 14h14L34 13ZM18 38h12"/><path d="M7 27c2 5 12 5 14 0M27 27c2 5 12 5 14 0"/></svg>;
  if (type === "file") return <svg {...p}><path d="M13 7h16l8 8v26H13z"/><path d="M29 7v9h8M18 23h14M18 30h14M18 37h9"/></svg>;
  if (type === "calc") return <svg {...p}><rect x="12" y="6" width="24" height="36" rx="3"/><path d="M17 12h14v7H17zM18 26h.1M24 26h.1M30 26h.1M18 33h.1M24 33h.1M30 33h.1"/></svg>;
  if (type === "gavel") return <svg {...p}><path d="m15 12 10 10M20 7l15 15-6 6L14 13zM8 36l13-13M5 40h22"/></svg>;
  if (type === "briefcase") return <svg {...p}><rect x="7" y="14" width="34" height="25" rx="3"/><path d="M18 14V9h12v5M7 25h34M21 25v4h6v-4"/></svg>;
  if (type === "users") return <svg {...p}><circle cx="18" cy="17" r="6"/><circle cx="31" cy="18" r="5"/><path d="M7 39c1-8 6-12 12-12s11 4 12 12M28 29c6 0 10 3 12 9"/></svg>;
  if (type === "home") return <svg {...p}><path d="m7 23 17-15 17 15M12 20v20h24V20M20 40V29h8v11"/></svg>;
  if (type === "car") return <svg {...p}><path d="m10 28 3-10h22l3 10M8 28h32v9H8z"/><circle cx="14" cy="38" r="3"/><circle cx="34" cy="38" r="3"/></svg>;
  if (type === "cap") return <svg {...p}><path d="m5 19 19-10 19 10-19 10L5 19Z"/><path d="M13 24v9c7 6 15 6 22 0v-9M43 19v13"/></svg>;
  if (type === "medical") return <svg {...p}><rect x="9" y="8" width="30" height="32" rx="4"/><path d="M20 17h8v6h6v8h-6v6h-8v-6h-6v-8h6z"/></svg>;
  if (type === "laptop") return <svg {...p}><rect x="10" y="8" width="28" height="24" rx="3"/><path d="M6 39h36l-4-7H10l-4 7Z"/></svg>;
  if (type === "cart") return <svg {...p}><path d="M7 9h5l4 21h20l5-14H14"/><circle cx="20" cy="38" r="2"/><circle cx="34" cy="38" r="2"/></svg>;
  if (type === "book") return <svg {...p}><path d="M8 8h13c4 0 7 3 7 7v25c0-4-3-7-7-7H8zM40 8H27c-4 0-7 3-7 7v25c0-4 3-7 7-7h13z"/></svg>;
  if (type === "bot") return <svg {...p}><rect x="10" y="14" width="28" height="22" rx="6"/><path d="M24 8v6M17 24h.1M31 24h.1M18 31h12M6 22v8M42 22v8"/></svg>;
  if (type === "check") return <svg {...p}><rect x="10" y="7" width="28" height="34" rx="3"/><path d="m16 16 3 3 6-7M16 28l3 3 6-7M29 17h5M29 29h5"/></svg>;
  return <svg {...p}><circle cx="24" cy="16" r="7"/><path d="M12 39c1-9 6-14 12-14s11 5 12 14M37 12v9M33 16h8"/></svg>;
}

function ProductCard({ item }) {
  const format = (item.formats || [])[0] || "DOCX";
  return <Link className="dm-product-card" to={item.actionUrl || item.route || `/market/offer/${item.id}`}>
    <div className="dm-product-preview">
      <div className="dm-paper"><span/><span/><span/><span/><span/><span/></div>
      <span className="dm-favorite-mark">♡</span>
      <b data-format={format}>{format}</b>
    </div>
    <h3>{item.title}</h3>
    {!item.previewOnly && <div className="dm-rating">★ <strong>{item.featured ? "4.9" : "4.8"}</strong> <span>({item.featured ? "72" : "24"})</span></div>}
    <strong className="dm-price">{money(item)}</strong>
    <small>{item.providerName || "ДокМаркет"}{!item.previewOnly && <i>✓</i>}</small>
  </Link>;
}

function PlatformServiceCard() {
  return <Link className="dm-service-tile dm-platform-service" to="/dosudebka">
    <div className="dm-service-icon"><LineIcon type="gavel" color="#ff9f1c" size={46}/></div>
    <div className="dm-service-copy"><span>Сервис платформы</span><h3>Досудебка</h3><p>Собирает данные по ситуации и формирует досудебную претензию.</p><div className="dm-rating">★ <strong>5.0</strong></div><strong className="dm-service-price">от 800 ₽</strong><small>ДокМаркет</small></div>
  </Link>;
}

function SpecialistServiceCard({ seller }) {
  return <Link className="dm-service-tile" to={`/market/specialist/${seller.user_id}`}>
    <div className="dm-specialist-avatar">{initialsOf(seller.display_name)}</div>
    <div className="dm-service-copy"><span>Специалист</span><h3>{seller.headline || "Услуги специалиста"}</h3><div className="dm-rating">★ <strong>{Number(seller.rating || 0).toFixed(1)}</strong></div><strong className="dm-service-price">Уточнить цену</strong><small>{seller.display_name}</small></div>
  </Link>;
}

export default function DocMarketHome() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    Promise.all([loadPublishedCatalog(), listPublicSellers(8)]).then(([items, profiles]) => {
      if (!live) return;
      setCatalog(items || []);
      setSellers(profiles || []);
    }).catch(() => {}).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const documents = useMemo(() => catalog.filter(item => !["service", "platform_generator"].includes(item.type)), [catalog]);
  const serviceItems = useMemo(() => catalog.filter(item => item.type === "service"), [catalog]);
  const visibleDocuments = documents.length ? documents.slice(0, 10) : fallbackDocuments;

  function submitSearch(event) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/market?q=${encodeURIComponent(q)}` : "/market");
  }

  return <MarketFrame>
    <section className="dm-market-top">
      <form className="dm-market-search" onSubmit={submitSearch}>
        <LineIcon type="search" color="#91a1b3" size={26}/>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти документ, услугу или специалиста" aria-label="Поиск по ДокМаркету" />
        <button type="submit" aria-label="Найти">→</button>
      </form>
      <div className="dm-market-quick">
        <Link to="/market/favorites"><LineIcon type="heart" color="#ff8d2a" size={30}/><span><strong>Избранное</strong><small>Сохранённые</small></span></Link>
        <Link to="/market/cart"><LineIcon type="bag" color="#ff9f1c" size={30}/><span><strong>Корзина</strong><small>Ваши покупки</small></span></Link>
        <Link to="/RegisterLawyer"><LineIcon type="store" color="#55d786" size={30}/><span><strong>Продавать</strong><small>Стать продавцом</small></span></Link>
      </div>
    </section>

    <section className="dm-category-section">
      <div className="dm-storefront-heading"><h1>Каталог</h1><Link to="/market">Все категории →</Link></div>
      <div className="dm-category-grid">{categories.map(([title, slug, color, icon]) => {
        const to = slug === "dosudebka" ? "/dosudebka" : slug === "services" ? "/market?type=service" : `/market?category=${encodeURIComponent(slug)}`;
        return <Link className="dm-category-card" to={to} key={slug}><strong>{title.split("\n").map((line, index) => <span key={line}>{line}{index === 0 && title.includes("\n") ? <br/> : null}</span>)}</strong><LineIcon type={icon} color={color}/></Link>;
      })}</div>
    </section>

    <section className="dm-shelf">
      <div className="dm-storefront-heading"><h2>Популярные документы</h2><Link to="/market?type=document">Все товары →</Link></div>
      {loading ? <div className="dm-horizontal-shelf">{[1,2,3,4].map(x => <div className="dm-product-card dm-skeleton-card" key={x}/>)}</div> : <div className="dm-horizontal-shelf">{visibleDocuments.map(item => <ProductCard key={item.id} item={item}/>)}</div>}
      {!documents.length && !loading && <p className="dm-shelf-note">Это быстрые переходы к популярным запросам. Реальные товары продавцов появятся здесь после публикации и модерации.</p>}
    </section>

    <section className="dm-shelf" id="specialists">
      <div className="dm-storefront-heading"><h2>Услуги и сервисы</h2><Link to="/market?type=service">Все услуги →</Link></div>
      <div className="dm-horizontal-services">
        <PlatformServiceCard />
        {serviceItems.slice(0,5).map(item => <Link className="dm-service-tile" key={item.id} to={item.actionUrl || item.route || `/market/offer/${item.id}`}><div className="dm-service-icon"><LineIcon type="specialist" color="#bd5bff" size={44}/></div><div className="dm-service-copy"><span>Услуга</span><h3>{item.title}</h3><div className="dm-rating">★ <strong>4.9</strong></div><strong className="dm-service-price">{money(item)}</strong><small>{item.providerName || "ДокМаркет"}</small></div></Link>)}
        {sellers.slice(0,4).map(seller => <SpecialistServiceCard key={seller.user_id} seller={seller}/>) }
      </div>
    </section>

    <nav className="dm-mobile-bottom" aria-label="Нижняя навигация">
      <Link className="active" to="/"><LineIcon type="home-nav" size={24}/><span>Главная</span></Link>
      <Link to="/market"><LineIcon type="search" size={24}/><span>Каталог</span></Link>
      <Link to="/MyDocuments"><LineIcon type="docs-nav" size={24}/><span>Мои документы</span></Link>
      <Link to="/market/favorites"><LineIcon type="heart" size={24}/><span>Избранное</span></Link>
      <Link to="/Dashboard"><LineIcon type="user-nav" size={24}/><span>Профиль</span></Link>
    </nav>

    <style>{`
      .dm-market-top{margin-bottom:28px}.dm-market-search{display:grid;grid-template-columns:auto 1fr auto;align-items:center;height:62px;padding:0 10px 0 17px;border:1px solid rgba(107,142,166,.24);border-radius:18px;background:#0d1a28}.dm-market-search input{height:60px;border:0;outline:0;background:transparent;color:#fff;padding:0 13px;font-size:1rem;min-width:0}.dm-market-search button{width:42px;height:42px;border:0;border-radius:12px;background:transparent;color:#93a4b7;font-size:1.3rem}.dm-market-quick{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.dm-market-quick a{min-height:78px;padding:13px 16px;border-radius:16px;border:1px solid rgba(129,159,180,.13);background:#0d1926;color:#fff;text-decoration:none;display:flex;align-items:center;gap:13px}.dm-market-quick span{display:grid;gap:4px}.dm-market-quick strong{font-size:.82rem}.dm-market-quick small{color:#78889d;font-size:.68rem}
      .dm-category-section,.dm-shelf{margin-bottom:32px}.dm-storefront-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.dm-storefront-heading h1,.dm-storefront-heading h2{margin:0;color:#fff;font:800 clamp(1.45rem,4vw,2rem)/1.1 'Space Grotesk',sans-serif}.dm-storefront-heading a{color:#25c9e8;text-decoration:none;font-size:.78rem;font-weight:800;white-space:nowrap}.dm-category-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.dm-category-card{min-height:150px;padding:15px 10px 12px;border-radius:17px;border:1px solid rgba(76,128,155,.28);background:linear-gradient(180deg,#0f1d2c,#0c1824);color:#fff;text-decoration:none;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center}.dm-category-card strong{font-size:.83rem;line-height:1.16}.dm-category-card svg{filter:drop-shadow(0 0 8px color-mix(in srgb,currentColor 25%,transparent))}
      .dm-horizontal-shelf,.dm-horizontal-services{display:flex;gap:10px;overflow-x:auto;padding:1px 1px 8px;scrollbar-width:none}.dm-horizontal-shelf::-webkit-scrollbar,.dm-horizontal-services::-webkit-scrollbar{display:none}.dm-product-card{flex:0 0 182px;padding:10px;border-radius:16px;border:1px solid rgba(101,139,164,.18);background:#0d1b29;color:#fff;text-decoration:none;display:grid;gap:8px}.dm-product-preview{height:138px;border-radius:12px;background:#162536;position:relative;overflow:hidden;display:grid;place-items:center}.dm-paper{width:74%;height:112px;background:#f6f7f9;border-radius:3px;padding:13px 10px;display:grid;align-content:start;gap:7px;box-shadow:0 6px 20px #0005;transform:rotate(-1deg)}.dm-paper span{height:3px;border-radius:3px;background:#c9ced5}.dm-paper span:nth-child(2){width:82%}.dm-paper span:nth-child(3){width:94%}.dm-paper span:nth-child(4){width:68%}.dm-paper span:nth-child(5){width:88%}.dm-paper span:nth-child(6){width:55%}.dm-favorite-mark{position:absolute;right:8px;top:8px;width:30px;height:30px;border-radius:50%;background:#f8fafc;color:#142133;display:grid;place-items:center;font-size:1.25rem}.dm-product-preview>b{position:absolute;left:7px;bottom:7px;padding:4px 7px;border-radius:7px;background:#ef5350;color:#fff;font-size:.63rem}.dm-product-preview>b[data-format='DOCX']{background:#3978d7}.dm-product-preview>b[data-format='XLSX']{background:#53a769}.dm-product-card h3{font-size:.78rem;line-height:1.32;margin:0;min-height:42px}.dm-rating{color:#ffad2f;font-size:.7rem}.dm-rating span{color:#738399}.dm-price{font-size:.92rem}.dm-product-card>small{color:#7f90a4;font-size:.68rem}.dm-product-card>small i{font-style:normal;color:#25c9e8}.dm-skeleton-card{height:270px;opacity:.4}.dm-shelf-note{margin:7px 0 0;color:#66788d;font-size:.7rem;line-height:1.45}
      .dm-service-tile{flex:0 0 300px;min-height:166px;padding:14px;border-radius:17px;border:1px solid rgba(101,139,164,.18);background:#0d1b29;color:#fff;text-decoration:none;display:flex;gap:13px}.dm-service-icon,.dm-specialist-avatar{width:70px;height:70px;flex:0 0 70px;border-radius:18px;background:linear-gradient(145deg,#152638,#0f1c2a);display:grid;place-items:center;border:1px solid rgba(117,151,174,.18)}.dm-specialist-avatar{background:linear-gradient(135deg,#214963,#5b36a7);font-weight:900}.dm-service-copy{display:grid;align-content:start;gap:5px;min-width:0}.dm-service-copy>span{color:#8292a5;font-size:.64rem;text-transform:uppercase;letter-spacing:.06em}.dm-service-copy h3{margin:0;font-size:.95rem}.dm-service-copy p{margin:0;color:#8e9eb1;font-size:.7rem;line-height:1.4}.dm-service-price{margin-top:2px}.dm-service-copy small{color:#7c8da2;font-size:.68rem}.dm-platform-service{border-color:rgba(255,159,28,.2)}
      .dm-mobile-bottom{display:none}
      @media(max-width:700px){.market-shell{padding-bottom:94px!important}.dm-market-top{margin-bottom:24px}.dm-market-search{height:56px;border-radius:16px}.dm-market-search input{height:54px;font-size:.9rem}.dm-market-quick{gap:8px;margin-top:10px}.dm-market-quick a{min-height:68px;padding:10px 9px;gap:8px}.dm-market-quick svg{width:27px;height:27px;flex:0 0 27px}.dm-market-quick strong{font-size:.72rem}.dm-market-quick small{font-size:.59rem}.dm-category-section,.dm-shelf{margin-bottom:27px}.dm-storefront-heading h1,.dm-storefront-heading h2{font-size:1.3rem}.dm-storefront-heading a{font-size:.69rem}.dm-category-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.dm-category-card{min-height:119px;padding:10px 4px 9px;border-radius:14px}.dm-category-card strong{font-size:.67rem}.dm-category-card svg{width:34px;height:34px}.dm-product-card{flex-basis:154px}.dm-product-preview{height:118px}.dm-paper{height:94px}.dm-service-tile{flex-basis:275px;min-height:154px}.dm-mobile-bottom{position:fixed;left:0;right:0;bottom:0;z-index:78;height:72px;padding:7px max(8px,env(safe-area-inset-left)) calc(7px + env(safe-area-inset-bottom));background:rgba(7,17,29,.98);border-top:1px solid rgba(107,142,166,.15);display:grid;grid-template-columns:repeat(5,1fr);align-items:start}.dm-mobile-bottom a{color:#728297;text-decoration:none;display:grid;place-items:center;gap:4px;font-size:.56rem;min-width:0}.dm-mobile-bottom svg{width:22px;height:22px}.dm-mobile-bottom a.active{color:#ff9f1c}.dm-assistant-fab{right:14px!important;bottom:calc(84px + env(safe-area-inset-bottom,0px))!important;z-index:88!important}.dm-assistant{bottom:calc(144px + env(safe-area-inset-bottom,0px))!important;max-height:58dvh!important}}
      @media(max-width:420px){.dm-market-quick small{display:none}.dm-market-quick a{justify-content:center}.dm-category-card strong{font-size:.61rem}.dm-category-card{min-height:110px}.dm-product-card{flex-basis:148px}}
    `}</style>
  </MarketFrame>;
}
