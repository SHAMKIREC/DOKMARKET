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

const money = item => item.priceType === "free" ? "Бесплатно" : `${item.priceType === "from" ? "от " : ""}${Number(item.price || 0).toLocaleString("ru-RU")} ₽`;
const initialsOf = name => String(name || "Продавец").split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join("").toUpperCase();

function CategoryIcon({ type, color }) {
  const p = { width: 40, height: 40, viewBox: "0 0 48 48", fill: "none", stroke: color, strokeWidth: 2.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
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
  const format = (item.formats || [])[0] || (item.type === "guide" ? "PDF" : "DOCX");
  return <Link className="dm-product-card" to={item.actionUrl || item.route || `/market/offer/${item.id}`}>
    <div className="dm-product-preview">
      <div className="dm-paper"><span/><span/><span/><span/><span/></div>
      <button type="button" aria-label="В избранное" onClick={event => event.preventDefault()}>♡</button>
      <b>{format}</b>
    </div>
    <h3>{item.title}</h3>
    <div className="dm-rating">★ <strong>{item.featured ? "4.9" : "4.8"}</strong> <span>({item.featured ? "72" : "24"})</span></div>
    <strong className="dm-price">{money(item)}</strong>
    <small>{item.providerName || "ДокМаркет"} <i>✓</i></small>
  </Link>;
}

function ServiceCard({ title, price, to, seller, rating = "4.9" }) {
  return <Link className="dm-service-tile" to={to}><div className="dm-service-people"><span>{initialsOf(seller)}</span><span>{initialsOf(title)}</span></div><h3>{title}</h3><div>★ {rating}</div><strong>{price}</strong><small>{seller}</small></Link>;
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
  const services = useMemo(() => catalog.filter(item => ["service", "platform_generator"].includes(item.type)), [catalog]);

  function submitSearch(event) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/market?q=${encodeURIComponent(q)}` : "/market");
  }

  return <MarketFrame>
    <section className="dm-market-top">
      <form className="dm-market-search" onSubmit={submitSearch}>
        <span className="dm-search-icon">⌕</span>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти документ, услугу или специалиста" aria-label="Поиск по ДокМаркету" />
        <button type="submit" aria-label="Найти">↗</button>
      </form>
      <div className="dm-market-quick">
        <Link to="/market/favorites"><b>♡</b><span><strong>Избранное</strong><small>Сохранённые</small></span></Link>
        <Link to="/market/cart"><b>▱</b><span><strong>Корзина</strong><small>Ваши покупки</small></span></Link>
        <Link to="/RegisterLawyer"><b>▤</b><span><strong>Продавать</strong><small>Стать продавцом</small></span></Link>
      </div>
    </section>

    <section className="dm-category-section">
      <div className="dm-storefront-heading"><h1>Каталог</h1><Link to="/market">Все категории →</Link></div>
      <div className="dm-category-grid">{categories.map(([title, slug, color, icon]) => {
        const to = slug === "dosudebka" ? "/dosudebka" : slug === "services" ? "/market?type=service" : `/market?category=${encodeURIComponent(slug)}`;
        return <Link className="dm-category-card" to={to} key={slug}><strong>{title.split("\n").map((line, index) => <span key={line}>{line}{index === 0 && title.includes("\n") ? <br/> : null}</span>)}</strong><CategoryIcon type={icon} color={color}/></Link>;
      })}</div>
    </section>

    <section className="dm-shelf">
      <div className="dm-storefront-heading"><h2>Популярные документы</h2><Link to="/market?type=document">Все товары →</Link></div>
      {loading ? <div className="dm-horizontal-shelf">{[1,2,3,4].map(x => <div className="dm-product-card dm-skeleton-card" key={x}/>)}</div> : documents.length ? <div className="dm-horizontal-shelf">{documents.slice(0,10).map(item => <ProductCard key={item.id} item={item}/>)}</div> : <div className="dm-empty-mini"><strong>Пока нет опубликованных документов</strong><span>После модерации товары появятся здесь автоматически.</span><Link to="/market">Открыть каталог</Link></div>}
    </section>

    <section className="dm-shelf">
      <div className="dm-storefront-heading"><h2>Услуги и сервисы</h2><Link to="/market?type=service">Все услуги →</Link></div>
      <div className="dm-horizontal-services">
        <ServiceCard title="Досудебка" price="от 490 ₽" to="/dosudebka" seller="ДокМаркет" rating="5.0"/>
        {services.slice(0,5).map(item => <ServiceCard key={item.id} title={item.title} price={money(item)} to={item.actionUrl || item.route || `/market/offer/${item.id}`} seller={item.providerName || "ДокМаркет"}/>) }
        {sellers.slice(0,4).map(seller => <ServiceCard key={seller.user_id} title={seller.headline || "Услуги специалиста"} price="Уточнить цену" to={`/market/specialist/${seller.user_id}`} seller={seller.display_name} rating={Number(seller.rating || 0).toFixed(1)}/>) }
      </div>
    </section>

    <nav className="dm-mobile-bottom" aria-label="Нижняя навигация">
      <Link className="active" to="/"><b>⌂</b><span>Главная</span></Link>
      <Link to="/market"><b>⌕</b><span>Каталог</span></Link>
      <Link to="/MyDocuments"><b>▤</b><span>Мои документы</span></Link>
      <Link to="/market/favorites"><b>♡</b><span>Избранное</span></Link>
      <Link to="/Dashboard"><b>♙</b><span>Профиль</span></Link>
    </nav>

    <style>{`
      .dm-market-top{margin-bottom:24px}.dm-market-search{display:grid;grid-template-columns:auto 1fr auto;align-items:center;height:62px;border:1px solid rgba(107,142,166,.22);border-radius:18px;background:#0d1a28;box-shadow:inset 0 0 0 1px rgba(255,255,255,.01)}.dm-search-icon{padding-left:18px;color:#93a4b7;font-size:2rem;line-height:1}.dm-market-search input{height:60px;border:0;outline:0;background:transparent;color:#fff;padding:0 14px;font-size:1rem}.dm-market-search button{width:46px;height:46px;margin-right:8px;border:0;border-radius:13px;background:transparent;color:#93a4b7;font-size:1.1rem}.dm-market-quick{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.dm-market-quick a{min-height:72px;padding:12px 14px;border-radius:16px;border:1px solid rgba(148,163,184,.12);background:#0d1a28;color:#fff;text-decoration:none;display:flex;align-items:center;gap:12px}.dm-market-quick b{font-size:1.8rem;color:#ff9d2f}.dm-market-quick span{display:grid;gap:2px}.dm-market-quick strong{font-size:.9rem}.dm-market-quick small{color:#7f8ea1;font-size:.7rem}
      .dm-category-section,.dm-shelf{margin-bottom:30px}.dm-storefront-heading{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:14px}.dm-storefront-heading h1,.dm-storefront-heading h2{margin:0;color:#fff;font:800 1.45rem/1.1 'Space Grotesk',sans-serif}.dm-storefront-heading>a{color:#22d3ee;text-decoration:none;font-size:.78rem;font-weight:800;white-space:nowrap}.dm-category-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.dm-category-card{min-height:150px;padding:14px 10px;border-radius:16px;background:linear-gradient(180deg,#111f2f,#0c1927);border:1px solid rgba(148,163,184,.14);color:#fff;text-decoration:none;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;box-shadow:inset 0 1px rgba(255,255,255,.02)}.dm-category-card strong{font-size:.9rem;line-height:1.18;min-height:40px}.dm-category-card svg{margin:6px auto 4px;filter:drop-shadow(0 0 10px rgba(255,255,255,.04))}.dm-category-card:hover{transform:translateY(-2px);border-color:rgba(103,232,249,.28)}
      .dm-horizontal-shelf,.dm-horizontal-services{display:flex;gap:10px;overflow-x:auto;padding:2px 1px 6px;scrollbar-width:none}.dm-horizontal-shelf::-webkit-scrollbar,.dm-horizontal-services::-webkit-scrollbar{display:none}.dm-product-card{flex:0 0 210px;min-width:210px;padding:10px;border-radius:15px;background:#0d1a28;border:1px solid rgba(148,163,184,.12);color:#fff;text-decoration:none}.dm-product-preview{height:150px;border-radius:11px;background:#dfe5e9;position:relative;display:grid;place-items:center;overflow:hidden}.dm-paper{width:74%;height:86%;background:#fff;border-radius:3px;box-shadow:0 8px 22px rgba(0,0,0,.2);padding:16px 10px;display:grid;align-content:start;gap:6px}.dm-paper span{display:block;height:3px;border-radius:3px;background:#c9cfd5}.dm-paper span:nth-child(2){width:80%}.dm-paper span:nth-child(3){width:92%}.dm-paper span:nth-child(4){width:72%}.dm-paper span:nth-child(5){width:88%}.dm-product-preview button{position:absolute;right:7px;top:7px;width:32px;height:32px;border:0;border-radius:50%;background:#fff;color:#172033;font-size:1.25rem}.dm-product-preview>b{position:absolute;left:6px;bottom:6px;padding:4px 7px;border-radius:7px;background:#ef5350;color:#fff;font-size:.65rem}.dm-product-card h3{margin:10px 0 7px;font-size:.82rem;line-height:1.32;min-height:34px}.dm-rating{font-size:.7rem;color:#ffb020}.dm-rating span{color:#738399}.dm-price{display:block;margin:7px 0 5px;font-size:1rem}.dm-product-card>small{color:#8494a7;font-size:.68rem}.dm-product-card>small i{font-style:normal;color:#22d3ee}.dm-skeleton-card{height:270px;background:linear-gradient(90deg,#0d1a28,#142538,#0d1a28);background-size:200% 100%;animation:market-shimmer 1.3s infinite}
      .dm-service-tile{flex:0 0 220px;min-height:170px;padding:14px;border-radius:16px;background:#0d1a28;border:1px solid rgba(148,163,184,.12);color:#fff;text-decoration:none;display:grid;gap:7px}.dm-service-people{display:flex}.dm-service-people span{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,#26374a,#111c2a);border:1px solid rgba(255,255,255,.08);font-size:.72rem;font-weight:850}.dm-service-people span+span{margin-left:-9px}.dm-service-tile h3{margin:0;font-size:.88rem;line-height:1.25}.dm-service-tile>div:nth-of-type(2){color:#ffb020;font-size:.72rem}.dm-service-tile>strong{font-size:.9rem}.dm-service-tile>small{color:#7f8ea1}.dm-empty-mini{padding:20px;border-radius:16px;background:#0d1a28;border:1px solid rgba(148,163,184,.12);display:grid;gap:7px;color:#fff}.dm-empty-mini span{color:#8fa0b3;font-size:.8rem}.dm-empty-mini a{color:#22d3ee;text-decoration:none;font-weight:800;font-size:.78rem}
      .dm-mobile-bottom{display:none}
      @media(max-width:900px){.dm-category-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
      @media(max-width:640px){.market-content{padding-bottom:92px!important}.dm-market-top{margin-bottom:22px}.dm-market-search{height:54px;border-radius:15px}.dm-market-search input{height:52px;font-size:.9rem}.dm-search-icon{font-size:1.65rem;padding-left:14px}.dm-market-search button{display:none}.dm-market-quick{gap:8px;margin-top:10px}.dm-market-quick a{min-height:62px;padding:9px 10px;gap:8px}.dm-market-quick b{font-size:1.45rem}.dm-market-quick strong{font-size:.72rem}.dm-market-quick small{font-size:.58rem}.dm-category-section,.dm-shelf{margin-bottom:24px}.dm-storefront-heading{margin-bottom:11px}.dm-storefront-heading h1,.dm-storefront-heading h2{font-size:1.12rem}.dm-storefront-heading>a{font-size:.68rem}.dm-category-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.dm-category-card{min-height:112px;padding:9px 5px;border-radius:13px}.dm-category-card strong{font-size:.66rem;min-height:32px}.dm-category-card svg{width:31px;height:31px}.dm-product-card{flex-basis:168px;min-width:168px;padding:8px}.dm-product-preview{height:126px}.dm-product-card h3{font-size:.72rem}.dm-service-tile{flex-basis:174px;min-height:155px;padding:11px}.dm-service-tile h3{font-size:.76rem}.dm-mobile-bottom{position:fixed;left:0;right:0;bottom:0;z-index:70;height:68px;padding-bottom:env(safe-area-inset-bottom);background:rgba(7,17,29,.98);border-top:1px solid rgba(148,163,184,.12);display:grid;grid-template-columns:repeat(5,1fr)}.dm-mobile-bottom a{display:grid;place-items:center;align-content:center;gap:2px;color:#748397;text-decoration:none;font-size:.56rem}.dm-mobile-bottom b{font-size:1.2rem}.dm-mobile-bottom a.active{color:#ff9d2f}}
      @media(max-width:390px){.dm-category-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.dm-category-card{min-height:106px}.dm-category-card strong{font-size:.61rem}.dm-category-card svg{width:29px;height:29px}}
    `}</style>
  </MarketFrame>;
}
