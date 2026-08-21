import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadPublishedCatalog } from "@/marketplace/services/catalogService";
import { listPublicSellers } from "@/marketplace/services/sellerProfileService";
import { MarketFrame, OffersGrid } from "./Market";

const categories = [
  ["Юридические", "Претензии, жалобы, заявления", "fa-scale-balanced", "legal"],
  ["Договоры", "Работа, услуги, аренда, сделки", "fa-file-signature", "contracts"],
  ["Бухгалтерия", "Акты, счета, учёт и отчётность", "fa-calculator", "accounting"],
  ["Бизнес", "ИП, самозанятые, компании", "fa-briefcase", "business"],
  ["Кадры и HR", "Работники, приказы, регламенты", "fa-users", "hr"],
  ["Недвижимость", "Аренда, сделки, акты", "fa-house", "realty"],
  ["Авто", "Купля-продажа, доверенности, споры", "fa-car", "auto"],
  ["Образование", "Заявления, договоры, обучение", "fa-graduation-cap", "education"],
  ["Медицина", "Согласия, заявления, документы", "fa-notes-medical", "medicine"],
  ["Фриланс", "Заказы, услуги, NDA, акты", "fa-laptop-code", "freelance"],
  ["Маркетплейсы", "Продавцам и исполнителям", "fa-store", "marketplaces"],
  ["Инструкции", "Чек-листы и готовые формы", "fa-list-check", "guides"],
];

const money = item => item.priceType === "free" ? "Бесплатно" : `${item.priceType === "from" ? "от " : ""}${Number(item.price || 0).toLocaleString("ru-RU")} ₽`;
const initialsOf = name => String(name || "Продавец").split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join("").toUpperCase();

export default function DocMarketHome() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    Promise.all([loadPublishedCatalog(), listPublicSellers(8)])
      .then(([items, profiles]) => {
        if (!live) return;
        setCatalog(items || []);
        setSellers(profiles || []);
      })
      .catch(() => {})
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const documents = useMemo(() => catalog.filter(item => !["service", "platform_generator"].includes(item.type)), [catalog]);
  const services = useMemo(() => catalog.filter(item => ["service", "platform_generator"].includes(item.type)), [catalog]);
  const featured = useMemo(() => [...catalog].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 8), [catalog]);

  function submitSearch(event) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/market?q=${encodeURIComponent(q)}` : "/market");
  }

  return <MarketFrame>
    <section className="dm-market-top">
      <form className="dm-market-search" onSubmit={submitSearch}>
        <i className="fa-solid fa-magnifying-glass" />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти документ, услугу или специалиста" aria-label="Поиск по ДокМаркету" />
        <button type="submit">Найти</button>
      </form>
      <div className="dm-market-quick">
        <Link to="/market/favorites"><i className="fa-regular fa-heart" /><span>Избранное</span></Link>
        <Link to="/market/cart"><i className="fa-solid fa-bag-shopping" /><span>Корзина</span></Link>
        <Link to="/RegisterLawyer"><i className="fa-solid fa-store" /><span>Продавать</span></Link>
      </div>
    </section>

    <section className="dm-category-section">
      <div className="dm-storefront-heading"><div><span>КАТАЛОГ</span><h1>Что вам нужно?</h1></div><Link to="/market">Все товары →</Link></div>
      <div className="dm-category-grid">{categories.map(([title, text, icon, slug]) =>
        <Link className="dm-category-card" to={`/market?category=${encodeURIComponent(slug)}`} key={slug}>
          <div><strong>{title}</strong><small>{text}</small></div>
          <span><i className={`fa-solid ${icon}`} /></span>
        </Link>
      )}</div>
    </section>

    <section className="dm-shelf">
      <div className="dm-storefront-heading"><div><span>ВИТРИНА</span><h2>Популярное сейчас</h2></div><Link to="/market">Смотреть всё →</Link></div>
      {loading ? <div className="market-loading">{[1,2,3,4].map(x => <div className="market-skeleton" key={x} />)}</div> : featured.length ? <OffersGrid items={featured} /> : <div className="market-empty market-glass"><h3>Витрина наполняется</h3><p>Новые документы и услуги появятся после публикации продавцами.</p></div>}
    </section>

    {documents.length > 0 && <section className="dm-shelf">
      <div className="dm-storefront-heading"><div><span>ДОКУМЕНТЫ</span><h2>Готовые документы</h2></div><Link to="/market?type=document">Все документы →</Link></div>
      <OffersGrid items={documents.slice(0, 8)} />
    </section>}

    {services.length > 0 && <section className="dm-shelf">
      <div className="dm-storefront-heading"><div><span>УСЛУГИ</span><h2>Услуги и сервисы</h2></div><Link to="/market?type=service">Все услуги →</Link></div>
      <OffersGrid items={services.slice(0, 8)} />
    </section>}

    <section id="verified-sellers" className="dm-shelf">
      <div className="dm-storefront-heading"><div><span>ПРОДАВЦЫ</span><h2>Магазины специалистов</h2></div><Link to="/RegisterLawyer">Стать продавцом →</Link></div>
      {sellers.length ? <div className="dm-seller-row">{sellers.map(seller => <Link className="dm-seller-mini" to={`/market/specialist/${seller.user_id}`} key={seller.user_id}><span>{initialsOf(seller.display_name)}</span><div><strong>{seller.display_name}</strong><small>★ {Number(seller.rating || 0).toFixed(1)} · {Number(seller.reviews_count || 0)} отзывов</small></div></Link>)}</div> : <div className="market-empty market-glass"><h3>Первые магазины готовятся</h3><p>После модерации продавцы появятся здесь со своими товарами и рейтингом.</p></div>}
    </section>

    <section className="dm-seller-banner market-glass">
      <div><span>ПРОДАВЦАМ</span><h2>Есть полезные документы?</h2><p>Откройте магазин, загрузите товар, пройдите модерацию и продавайте через ДокМаркет.</p></div>
      <Link className="market-primary" to="/RegisterLawyer">Открыть магазин</Link>
    </section>

    <style>{`
      .dm-market-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;margin-bottom:20px}.dm-market-search{display:grid;grid-template-columns:auto 1fr auto;align-items:center;min-height:58px;border:1px solid rgba(103,232,249,.18);border-radius:18px;background:rgba(15,23,42,.82);overflow:hidden}.dm-market-search>i{padding-left:18px;color:#67e8f9}.dm-market-search input{width:100%;height:56px;border:0;outline:0;background:transparent;color:#fff;padding:0 14px;font-size:1rem}.dm-market-search button{height:44px;margin-right:7px;padding:0 20px;border:0;border-radius:12px;background:linear-gradient(135deg,#0891b2,#7c3aed);color:#fff;font-weight:850}.dm-market-quick{display:flex;gap:8px}.dm-market-quick a{min-width:82px;height:58px;padding:0 12px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:rgba(15,23,42,.78);color:#cbd5e1;text-decoration:none;display:grid;place-items:center;align-content:center;gap:3px;font-size:.66rem;font-weight:750}.dm-market-quick i{font-size:1rem;color:#a5f3fc}
      .dm-category-section,.dm-shelf{margin-bottom:30px}.dm-storefront-heading{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:14px}.dm-storefront-heading span,.dm-seller-banner>div>span{display:block;color:#67e8f9;font-size:.68rem;letter-spacing:.11em;font-weight:900}.dm-storefront-heading h1,.dm-storefront-heading h2{margin:4px 0 0;color:#fff;font:800 clamp(1.5rem,4vw,2.25rem)/1.08 'Space Grotesk',sans-serif}.dm-storefront-heading>a{color:#67e8f9;text-decoration:none;font-size:.78rem;font-weight:800;white-space:nowrap}
      .dm-category-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.dm-category-card{position:relative;min-height:142px;padding:16px;border-radius:18px;background:linear-gradient(145deg,rgba(20,32,52,.95),rgba(13,20,34,.95));border:1px solid rgba(148,163,184,.12);color:#fff;text-decoration:none;overflow:hidden}.dm-category-card>div{position:relative;z-index:2;display:grid;gap:5px;max-width:70%}.dm-category-card strong{font-size:1rem}.dm-category-card small{color:#91a0b4;font-size:.7rem;line-height:1.35}.dm-category-card>span{position:absolute;right:-7px;bottom:-10px;width:86px;height:86px;border-radius:28px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(34,211,238,.2),rgba(139,92,246,.24));transform:rotate(-7deg)}.dm-category-card i{font-size:2rem;color:#dff9ff}.dm-category-card:hover{border-color:rgba(103,232,249,.28);transform:translateY(-2px)}
      .dm-seller-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.dm-seller-mini{display:flex;gap:10px;align-items:center;padding:14px;border-radius:16px;border:1px solid rgba(148,163,184,.12);background:rgba(15,23,42,.78);color:#fff;text-decoration:none}.dm-seller-mini>span{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#0891b2,#7c3aed);font-weight:900}.dm-seller-mini>div{display:grid;gap:4px;min-width:0}.dm-seller-mini strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dm-seller-mini small{color:#94a3b8;font-size:.68rem}.dm-seller-banner{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:24px;border-radius:20px;margin:8px 0 20px}.dm-seller-banner h2{margin:5px 0;color:#fff}.dm-seller-banner p{margin:0;color:#94a3b8;max-width:720px;line-height:1.5}
      @media(max-width:900px){.dm-category-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.dm-seller-row{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:640px){.dm-market-top{display:block;margin-bottom:16px}.dm-market-search{min-height:52px;border-radius:15px}.dm-market-search input{height:50px;font-size:.92rem}.dm-market-search button{display:none}.dm-market-quick{margin-top:8px}.dm-market-quick a{flex:1;min-width:0;height:44px;display:flex;gap:6px;border-radius:12px;font-size:.67rem}.dm-category-section,.dm-shelf{margin-bottom:24px}.dm-storefront-heading{align-items:center;margin-bottom:11px}.dm-storefront-heading h1,.dm-storefront-heading h2{font-size:1.45rem}.dm-storefront-heading>a{font-size:.69rem}.dm-category-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.dm-category-card{min-height:118px;padding:11px;border-radius:15px}.dm-category-card>div{max-width:100%}.dm-category-card strong{font-size:.8rem;line-height:1.2}.dm-category-card small{display:none}.dm-category-card>span{width:62px;height:62px;right:-7px;bottom:-10px;border-radius:20px}.dm-category-card i{font-size:1.45rem}.dm-seller-row{display:flex;overflow-x:auto;gap:8px;padding-bottom:4px}.dm-seller-mini{min-width:235px}.dm-seller-banner{display:grid;padding:18px}.dm-seller-banner .market-primary{width:100%}}
    `}</style>
  </MarketFrame>;
}
