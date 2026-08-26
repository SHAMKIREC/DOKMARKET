import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadPublishedCatalog } from "@/marketplace/services/catalogService";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
import DocMarketIcon,{docMarketIconStyles} from "@/marketplace/components/DocMarketIconKit";
import { CATEGORY_SPRITE } from "@/marketplace/components/categoryArtwork";
import { MarketFrame } from "./Market";

const POS=[0,33.333,66.666,100];
const categories=[
  {title:"Юридические",slug:"legal",x:0,y:0},
  {title:"Договоры",slug:"contracts",x:1,y:0},
  {title:"Бухгалтерия",slug:"accounting",x:2,y:0},
  {title:"Досудебка",slug:"dosudebka",x:3,y:0},
  {title:"Бизнес и ИП",slug:"business",x:0,y:1},
  {title:"Кадры и HR",slug:"hr",x:1,y:1},
  {title:"Недвижимость",slug:"realty",x:2,y:1},
  {title:"Авто",slug:"auto",x:3,y:1},
  {title:"Образование",slug:"education",x:0,y:2},
  {title:"Медицина",slug:"medicine",x:1,y:2},
  {title:"Фриланс",slug:"freelance",x:2,y:2},
  {title:"Маркетплейсы",slug:"marketplaces",x:3,y:2},
  {title:"Инструкции",slug:"guides",x:0,y:3},
  {title:"AI и технологии",slug:"ai",x:1,y:3},
  {title:"Чек-листы",slug:"checklists",x:2,y:3},
  {title:"Селлеры",slug:"specialists",x:3,y:3}
];
const bySlug=Object.fromEntries(categories.map(c=>[c.slug,c]));
const fallbackDocuments=[
  {id:"find-rent",title:"Договор аренды жилого помещения",formats:["DOCX"],providerName:"ДокМаркет",previewOnly:true,categorySlug:"contracts",actionUrl:"/market?category=contracts&q=аренда"},
  {id:"find-act",title:"Акт выполненных работ",formats:["DOCX"],providerName:"ДокМаркет",previewOnly:true,categorySlug:"business",actionUrl:"/market?category=business&q=акт"},
  {id:"find-claim",title:"Претензия на возврат денег",formats:["PDF"],providerName:"Досудебка",previewOnly:true,categorySlug:"dosudebka",actionUrl:"/dosudebka"}
];

const money=item=>item.priceType==="free"?"Бесплатно":`${item.priceType==="from"?"от ":""}${Number(item.price||0).toLocaleString("ru-RU")} ₽`;
const itemSlug=item=>String(item.categorySlug||item.category_slug||item.category||"").toLowerCase();
const categoryHref=c=>c.slug==="dosudebka"?"/dosudebka":c.slug==="specialists"?"/#verified-sellers":`/market?category=${encodeURIComponent(c.slug)}&type=document`;
const normalize=v=>String(v||"").toLowerCase().replace(/ё/g,"е");

function artStyle(slug){
  const c=bySlug[slug]||bySlug.contracts;
  return {
    backgroundImage:`linear-gradient(180deg,rgba(4,9,14,.01),rgba(4,9,14,.18)),url(${CATEGORY_SPRITE})`,
    backgroundSize:"400% 400%",
    backgroundPosition:`${POS[c.x]}% ${POS[c.y]}%`
  };
}

function MiniIcon({type,size=20,filled=false}){
  const p={width:size,height:size,viewBox:"0 0 24 24",fill:filled?"currentColor":"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":true};
  if(type==="search")return <svg {...p}><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>;
  if(type==="arrow")return <svg {...p}><path d="M5 12h14M14 7l5 5-5 5"/></svg>;
  return <svg {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
}

function ProductCard({item}){
  const [,refresh]=useState(0);
  const format=(item.formats||[])[0]||"DOCX";
  const rating=Number(item.rating||item.avg_rating||0);
  const reviewCount=Number(item.review_count||item.reviews_count||0);
  const favorite=!item.previewOnly&&isFavorite(item.id,"offer");
  const to=item.actionUrl||item.route||`/market/offer/${item.id}`;
  const slug=itemSlug(item)||"contracts";
  return <article className="dm-product-card">
    <div className="dm-product-preview">
      <Link className="dm-preview-link dm-product-art" style={artStyle(slug)} to={to} aria-label={item.title}><span className="dm-product-art-shine"/><b>{format}</b></Link>
      {!item.previewOnly&&<button className={`dm-favorite-mark ${favorite?"active":""}`} type="button" aria-label={favorite?"Убрать из избранного":"Добавить в избранное"} onClick={()=>{toggleFavorite(item.id,"offer");refresh(v=>v+1)}}><MiniIcon type="heart" size={15} filled={favorite}/></button>}
    </div>
    <div className="dm-product-copy">
      <Link className="dm-product-title" to={to}><h3>{item.title}</h3></Link>
      {rating>0&&reviewCount>0&&<div className="dm-product-rating"><span>★</span><b>{rating.toFixed(1)}</b><small>({reviewCount})</small></div>}
      {!item.previewOnly&&<strong className="dm-price">{money(item)}</strong>}
      <small>{item.providerName||"ДокМаркет"}</small>
      <Link className="dm-product-open" to={to}><span>{item.previewOnly?"Открыть":"Подробнее"}</span><MiniIcon type="arrow" size={14}/></Link>
    </div>
  </article>;
}

function PlatformServiceCard(){
  return <Link className="dm-service-tile" to="/dosudebka">
    <div className="dm-service-picture" style={artStyle("dosudebka")}/>
    <div className="dm-service-copy"><span>Сервис ДокМаркета</span><h3>Досудебка</h3><p>Создание претензии по вашей ситуации.</p><strong>от 490 ₽</strong></div>
  </Link>;
}

function ConstructionServiceCard(){
  return <Link className="dm-service-tile" to="/construction-docs">
    <div className="dm-service-picture" style={artStyle("realty")}/>
    <div className="dm-service-copy"><span>Сервис ДокМаркета</span><h3>Строительная документация</h3><p>ППР, акты, журналы и автоматизация.</p><strong>Открыть сервис</strong></div>
  </Link>;
}

export default function DocMarketHome(){
  const navigate=useNavigate();
  const [query,setQuery]=useState("");
  const [catalog,setCatalog]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showAll,setShowAll]=useState(false);

  useEffect(()=>{
    let live=true;
    loadPublishedCatalog().then(items=>{if(live)setCatalog(items||[])}).catch(()=>{}).finally(()=>{if(live)setLoading(false)});
    return()=>{live=false};
  },[]);

  const documents=useMemo(()=>catalog.filter(item=>!["service","platform_generator"].includes(item.type)),[catalog]);
  const serviceItems=useMemo(()=>catalog.filter(item=>{
    if(item.type!=="service")return false;
    const text=normalize([item.title,item.route,item.actionUrl].filter(Boolean).join(" "));
    return !text.includes("досудеб")&&!text.includes("dosudeb")&&!text.includes("строитель")&&!text.includes("construction");
  }),[catalog]);
  const visibleDocuments=documents.length?documents.slice(0,10):fallbackDocuments;
  const visibleCategories=showAll?categories:categories.slice(0,8);

  function submitSearch(e){
    e.preventDefault();
    const q=query.trim();
    navigate(q?`/market?q=${encodeURIComponent(q)}`:"/market");
  }

  return <MarketFrame>
    <style>{docMarketIconStyles}</style>

    <section className="dm-market-top">
      <form className="dm-market-search" onSubmit={submitSearch}>
        <MiniIcon type="search" size={21}/>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Документ, услуга или селлер" aria-label="Поиск по ДокМаркету"/>
        <button type="submit">Найти</button>
      </form>
    </section>

    <section className="dm-category-section">
      <div className="dm-storefront-heading"><h1>Каталог документов</h1><Link to="/market">Все категории →</Link></div>
      <div className="dm-category-grid">{visibleCategories.map(c=><Link className="dm-category-card" to={categoryHref(c)} key={c.slug}><div className="dm-category-art" style={artStyle(c.slug)}/><strong>{c.title}</strong></Link>)}</div>
      <button type="button" className="dm-more-cats" onClick={()=>setShowAll(v=>!v)}>{showAll?"Скрыть категории":"Показать все категории"}</button>
    </section>

    <section className="dm-shelf">
      <div className="dm-storefront-heading"><h2>Подборка документов</h2><Link to="/market?type=document">Все документы →</Link></div>
      <div className="dm-horizontal-shelf">{loading?[1,2,3].map(x=><div className="dm-product-card dm-skeleton-card" key={x}/>):visibleDocuments.map(item=><ProductCard key={item.id} item={item}/>)}</div>
    </section>

    <section className="dm-shelf" id="services">
      <div className="dm-storefront-heading"><h2>Сервисы ДокМаркета</h2><Link to="/market?type=service">Все сервисы →</Link></div>
      <div className="dm-horizontal-services">
        <PlatformServiceCard/>
        <ConstructionServiceCard/>
        {serviceItems.slice(0,2).map(item=><Link className="dm-service-tile dm-service-icon-tile" key={item.id} to={item.actionUrl||item.route||`/market/offer/${item.id}`}><DocMarketIcon name="services" size={48}/><div className="dm-service-copy"><span>Сервис ДокМаркета</span><h3>{item.title}</h3><strong>{money(item)}</strong><small>{item.providerName||"ДокМаркет"}</small></div></Link>)}
      </div>
    </section>

    <section className="dm-seller-block" id="verified-sellers">
      <div className="dm-seller-mark"><DocMarketIcon name="seller" size={52}/></div>
      <div className="dm-seller-copy"><span>Проверенные авторы и специалисты</span><h2>Витрины селлеров появятся после проверки</h2><p>Профиль публикуется только после проверки данных, документов и предложений. Так в каталоге не будет пустых или случайных аккаунтов.</p></div>
      <Link className="dm-seller-cta" to="/seller">Стать селлером <MiniIcon type="arrow" size={15}/></Link>
    </section>

    <section className="dm-home-links">
      <Link to="/reviews"><span>Отзывы покупателей</span><b>Читать →</b></Link>
      <Link to="/partners"><span>Партнёры ДокМаркета</span><b>Смотреть →</b></Link>
    </section>

    <style>{`
      .dm-market-top{margin:4px 0 14px}
      .dm-market-search{display:grid;grid-template-columns:auto 1fr auto;align-items:center;height:52px;padding:0 7px 0 13px;border:1px solid #3f3428;border-radius:15px;background:#0c1722;color:#d79b4a}
      .dm-market-search input{height:50px;border:0;outline:0;background:transparent;color:#fff;padding:0 10px;font-size:.88rem;min-width:0}
      .dm-market-search input::placeholder{color:#768493}.dm-market-search button{height:36px;border:1px solid #b97a2e;border-radius:10px;padding:0 13px;background:linear-gradient(135deg,#d98b2d,#f0b45d);color:#10141a;font-size:.73rem;font-weight:900}
      .dm-category-section,.dm-shelf{margin-bottom:18px}.dm-storefront-heading{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:9px}.dm-storefront-heading h1,.dm-storefront-heading h2{margin:0;color:#fff;font:800 1.24rem/1.08 'Space Grotesk',sans-serif}.dm-storefront-heading a{color:#dca253;text-decoration:none;font-size:.68rem;font-weight:800;white-space:nowrap}
      .dm-category-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.dm-category-card{position:relative;aspect-ratio:1/1;border-radius:15px;border:1px solid #4b3a27;background:#07111d;overflow:hidden;color:#fff;text-decoration:none;box-shadow:inset 0 1px rgba(255,255,255,.04),0 8px 18px rgba(0,0,0,.18)}.dm-category-art{position:absolute;inset:0;background-repeat:no-repeat;background-color:#07111d}.dm-category-card:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 46%,rgba(3,8,12,.15) 60%,rgba(3,8,12,.93) 100%);pointer-events:none}.dm-category-card strong{position:absolute;z-index:2;left:4px;right:4px;bottom:7px;text-align:center;font-size:.66rem;line-height:1.08;text-shadow:0 2px 5px #000}.dm-category-card:hover{border-color:#8a6337}
      .dm-more-cats{display:block;margin:9px auto 0;border:1px solid #554431;border-radius:10px;background:#0b141d;color:#dca253;padding:7px 12px;font-size:.67rem;font-weight:800}
      .dm-horizontal-shelf,.dm-horizontal-services{display:flex;gap:9px;overflow-x:auto;padding:1px 1px 7px;scrollbar-width:none;scroll-snap-type:x proximity}.dm-horizontal-shelf::-webkit-scrollbar,.dm-horizontal-services::-webkit-scrollbar{display:none}
      .dm-product-card{flex:0 0 158px;padding:7px;border-radius:15px;border:1px solid #2d3b46;background:#0d1822;color:#fff;display:flex;flex-direction:column;gap:7px;scroll-snap-align:start;box-shadow:0 8px 20px rgba(0,0,0,.12)}.dm-product-preview{aspect-ratio:1/1;border-radius:11px;background:#07111d;position:relative;overflow:hidden}.dm-preview-link{position:absolute;inset:0;color:inherit;text-decoration:none}.dm-product-art{background-repeat:no-repeat;background-color:#07111d}.dm-product-art:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 48%,rgba(5,10,14,.48))}.dm-product-art-shine{position:absolute;inset:0;background:radial-gradient(circle at 38% 22%,rgba(255,220,169,.12),transparent 34%)}.dm-favorite-mark{position:absolute;right:6px;top:6px;width:29px;height:29px;border-radius:50%;background:#0a1118e8;border:1px solid #554431;color:#d7a35d;display:grid;place-items:center;padding:0;z-index:3}.dm-favorite-mark.active{background:#2b1e0e;border-color:#7b5526}.dm-preview-link>b{position:absolute;z-index:3;left:7px;bottom:7px;padding:3px 6px;border-radius:6px;background:#4d4034;border:1px solid #81633f;font-size:.53rem}.dm-product-copy{display:grid;gap:5px}.dm-product-title{color:inherit;text-decoration:none}.dm-product-card h3{font-size:.72rem;line-height:1.23;margin:0;min-height:36px}.dm-product-rating{display:flex;align-items:center;gap:3px;font-size:.58rem;color:#8f9aa5}.dm-product-rating>span{color:#dca253}.dm-product-rating b{color:#f1d09d}.dm-price{font-size:.82rem}.dm-product-copy>small{color:#7f8a95;font-size:.58rem}.dm-product-open{display:flex;align-items:center;justify-content:space-between;gap:5px;margin-top:2px;padding:7px 8px;border-radius:9px;border:1px solid #584329;background:#17140f;color:#e7ac61;text-decoration:none;font-size:.63rem;font-weight:900}.dm-skeleton-card{height:250px;opacity:.35;background:linear-gradient(90deg,#0d1822,#152534,#0d1822);background-size:200% 100%;animation:dm-shimmer 1.3s infinite}
      .dm-service-tile{flex:0 0 262px;min-height:138px;display:grid;grid-template-columns:112px 1fr;gap:10px;padding:8px;border:1px solid #334554;border-radius:15px;background:#0d1822;color:#fff;text-decoration:none;overflow:hidden;scroll-snap-align:start}.dm-service-picture{width:112px;aspect-ratio:1/1;border-radius:11px;background-repeat:no-repeat;background-color:#07111d}.dm-service-copy{min-width:0;display:flex;flex-direction:column;justify-content:center;gap:4px}.dm-service-copy>span{color:#dca253;font-size:.55rem;font-weight:850;text-transform:uppercase}.dm-service-copy h3{margin:0;font-size:.78rem;line-height:1.18}.dm-service-copy p{margin:0;color:#8795a5;font-size:.62rem;line-height:1.3}.dm-service-copy strong{color:#fff;font-size:.72rem}.dm-service-copy small{color:#7e8b98;font-size:.58rem}.dm-service-icon-tile{grid-template-columns:58px 1fr;align-items:center}.dm-service-icon-tile .dm-premium-icon{border-radius:15px}
      .dm-seller-block{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;margin:3px 0 18px;padding:15px;border:1px solid #4c3926;border-radius:17px;background:radial-gradient(circle at 0 0,rgba(220,162,83,.1),transparent 28%),linear-gradient(145deg,#101b25,#0a151f);box-shadow:0 10px 26px rgba(0,0,0,.17)}.dm-seller-mark .dm-premium-icon{border-radius:15px}.dm-seller-copy>span{color:#dca253;font-size:.58rem;font-weight:850;text-transform:uppercase;letter-spacing:.04em}.dm-seller-copy h2{margin:3px 0 5px;color:#fff;font:800 1.02rem/1.15 'Space Grotesk',sans-serif}.dm-seller-copy p{margin:0;color:#91a0ae;font-size:.68rem;line-height:1.42}.dm-seller-cta{display:flex;align-items:center;gap:6px;white-space:nowrap;padding:9px 11px;border-radius:10px;background:linear-gradient(135deg,#d98b2d,#efb45e);color:#11161b;text-decoration:none;font-size:.67rem;font-weight:900}
      .dm-home-links{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.dm-home-links a{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:56px;padding:0 13px;border:1px solid #2f414f;border-radius:13px;background:#0c1822;color:#fff;text-decoration:none}.dm-home-links span{font-size:.72rem;font-weight:800}.dm-home-links b{color:#dca253;font-size:.62rem;white-space:nowrap}
      @keyframes dm-shimmer{to{background-position:-200% 0}}
      @media(max-width:760px){.dm-category-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.dm-category-card strong{font-size:.62rem}.dm-storefront-heading h1,.dm-storefront-heading h2{font-size:1.08rem}.dm-product-card{flex-basis:148px}.dm-seller-block{grid-template-columns:auto 1fr}.dm-seller-cta{grid-column:1/-1;justify-content:center}.dm-home-links{grid-template-columns:1fr}}
      @media(max-width:420px){.dm-market-search{height:48px}.dm-market-search input{height:46px;font-size:.8rem}.dm-market-search button{height:34px;padding:0 11px}.dm-category-grid{gap:6px}.dm-category-card{border-radius:13px}.dm-category-card strong{font-size:.58rem;bottom:6px}.dm-product-card{flex-basis:142px}.dm-service-tile{flex-basis:245px;grid-template-columns:100px 1fr}.dm-service-picture{width:100px}.dm-seller-block{padding:12px;gap:10px}.dm-seller-mark .dm-premium-icon{width:46px!important;height:46px!important}.dm-seller-copy h2{font-size:.91rem}.dm-seller-copy p{font-size:.64rem}}
    `}</style>
  </MarketFrame>;
}
