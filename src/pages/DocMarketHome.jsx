import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadPublishedCatalog } from "@/marketplace/services/catalogService";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
import DocMarketIcon,{docMarketIconStyles} from "@/marketplace/components/DocMarketIconKit";
import { CATEGORY_SPRITE } from "@/marketplace/components/categoryArtwork";
import { MarketFrame } from "./Market";

const POS=[0,33.333,66.666,100];
const artworkCells={
  legal:{x:0,y:0},contracts:{x:1,y:0},accounting:{x:2,y:0},dosudebka:{x:3,y:0},
  business:{x:0,y:1},hr:{x:1,y:1},realty:{x:2,y:1},auto:{x:3,y:1},
  education:{x:0,y:2},medicine:{x:1,y:2},freelance:{x:2,y:2},marketplaces:{x:3,y:2},
  guides:{x:0,y:3},ai:{x:1,y:3},checklists:{x:2,y:3},specialists:{x:3,y:3}
};

/* Только настоящие категории документов. Сервисы и специалисты больше не смешиваются с ними. */
const categories=[
  {title:"Юридические",slug:"legal"},
  {title:"Договоры",slug:"contracts"},
  {title:"Бухгалтерия",slug:"accounting"},
  {title:"Бизнес и ИП",slug:"business"},
  {title:"Кадры и HR",slug:"hr"},
  {title:"Недвижимость",slug:"realty"},
  {title:"Авто",slug:"auto"},
  {title:"Образование",slug:"education"},
  {title:"Медицина",slug:"medicine"},
  {title:"Фриланс",slug:"freelance"},
  {title:"Маркетплейсы",slug:"marketplaces"},
  {title:"Инструкции",slug:"guides"},
  {title:"AI и технологии",slug:"ai"},
  {title:"Чек-листы",slug:"checklists"}
];

const fallbackDocuments=[
  {id:"find-rent",title:"Договор аренды жилого помещения",formats:["DOCX"],providerName:"ДокМаркет",previewOnly:true,categorySlug:"contracts",actionUrl:"/market?category=contracts&q=аренда"},
  {id:"find-act",title:"Акт выполненных работ",formats:["DOCX"],providerName:"ДокМаркет",previewOnly:true,categorySlug:"business",actionUrl:"/market?category=business&q=акт"},
  {id:"find-claim",title:"Претензия на возврат денег",formats:["PDF"],providerName:"Досудебка",previewOnly:true,categorySlug:"dosudebka",actionUrl:"/dosudebka"}
];

const money=item=>item.priceType==="free"?"Бесплатно":`${item.priceType==="from"?"от ":""}${Number(item.price||0).toLocaleString("ru-RU")} ₽`;
const itemSlug=item=>String(item.categorySlug||item.category_slug||item.category||"").toLowerCase();
const categoryHref=c=>`/market?category=${encodeURIComponent(c.slug)}&type=document`;
const normalize=v=>String(v||"").toLowerCase().replace(/ё/g,"е");

function artStyle(slug){
  const c=artworkCells[slug]||artworkCells.contracts;
  return {
    backgroundImage:`url(${CATEGORY_SPRITE})`,
    backgroundSize:"400% 400%",
    backgroundPosition:`${POS[c.x]}% ${POS[c.y]}%`
  };
}

function MiniIcon({type,size=20,filled=false}){
  const p={width:size,height:size,viewBox:"0 0 24 24",fill:filled?"currentColor":"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":true};
  if(type==="search")return <svg {...p}><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>;
  if(type==="arrow")return <svg {...p}><path d="M5 12h14M14 7l5 5-5 5"/></svg>;
  if(type==="document")return <svg {...p}><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></svg>;
  if(type==="magic")return <svg {...p}><path d="m4 20 11-11M13 5l2-2 6 6-2 2M5 4v4M3 6h4M18 16v5M15.5 18.5h5"/></svg>;
  if(type==="person")return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-4.2 3.2-6.3 7.5-6.3s6.8 2.1 7.5 6.3"/></svg>;
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
    <div className="dm-service-copy"><span>Сервис ДокМаркета</span><h3>Досудебка</h3><p>Ответьте на вопросы — сервис соберёт претензию под вашу ситуацию.</p><strong>от 490 ₽</strong></div>
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
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Что вам нужно?" aria-label="Поиск по ДокМаркету"/>
        <button type="submit">Найти</button>
      </form>
    </section>

    <section className="dm-task-section" aria-label="Быстрый выбор задачи">
      <div className="dm-task-head"><span>Быстрый выбор</span><h1>Что хотите сделать?</h1></div>
      <div className="dm-task-grid">
        <Link className="dm-task-card" to="/market?type=document"><i><MiniIcon type="document" size={20}/></i><div><strong>Найти документ</strong><small>Готовые шаблоны и файлы</small></div><MiniIcon type="arrow" size={16}/></Link>
        <Link className="dm-task-card featured" to="/dosudebka"><i><MiniIcon type="magic" size={20}/></i><div><strong>Составить претензию</strong><small>Досудебка соберёт её по ответам</small></div><MiniIcon type="arrow" size={16}/></Link>
        <Link className="dm-task-card" to="/#specialists"><i><MiniIcon type="person" size={20}/></i><div><strong>Найти специалиста</strong><small>Проверенные селлеры и услуги</small></div><MiniIcon type="arrow" size={16}/></Link>
      </div>
    </section>

    <section className="dm-category-section">
      <div className="dm-storefront-heading"><div><span className="dm-section-kicker">По типу документа</span><h2>Категории</h2></div><Link to="/market?type=document">Все →</Link></div>
      <div className="dm-category-grid">{visibleCategories.map(c=><Link className="dm-category-card" to={categoryHref(c)} key={c.slug}><div className="dm-category-art" style={artStyle(c.slug)}/><strong>{c.title}</strong></Link>)}</div>
      <button type="button" className="dm-more-cats" onClick={()=>setShowAll(v=>!v)}>{showAll?"Скрыть":"Показать остальные категории"}</button>
    </section>

    <section className="dm-shelf">
      <div className="dm-storefront-heading"><h2>Популярные документы</h2><Link to="/market?type=document">Все документы →</Link></div>
      <div className="dm-horizontal-shelf">{loading?[1,2,3].map(x=><div className="dm-product-card dm-skeleton-card" key={x}/>):visibleDocuments.map(item=><ProductCard key={item.id} item={item}/>)}</div>
    </section>

    <section className="dm-shelf" id="services">
      <div className="dm-storefront-heading"><div><span className="dm-section-kicker">Не просто файл</span><h2>Сервисы ДокМаркета</h2></div><Link to="/market?type=service">Все сервисы →</Link></div>
      <div className="dm-horizontal-services">
        <PlatformServiceCard/>
        <ConstructionServiceCard/>
        {serviceItems.slice(0,2).map(item=><Link className="dm-service-tile dm-service-icon-tile" key={item.id} to={item.actionUrl||item.route||`/market/offer/${item.id}`}><DocMarketIcon name="services" size={48}/><div className="dm-service-copy"><span>Сервис ДокМаркета</span><h3>{item.title}</h3><strong>{money(item)}</strong><small>{item.providerName||"ДокМаркет"}</small></div></Link>)}
      </div>
    </section>

    <section className="dm-home-links">
      <Link to="/reviews"><span>Отзывы покупателей</span><b>Читать →</b></Link>
      <Link to="/partners"><span>Партнёры ДокМаркета</span><b>Смотреть →</b></Link>
    </section>

    <style>{`
      .dm-market-top{margin:4px 0 12px}
      .dm-market-search{display:grid;grid-template-columns:auto 1fr auto;align-items:center;height:52px;padding:0 7px 0 13px;border:1px solid #2b4050;border-radius:15px;background:#0b1722;color:#c58a42}
      .dm-market-search input{height:50px;border:0;outline:0;background:transparent;color:#fff;padding:0 10px;font-size:.88rem;min-width:0}.dm-market-search input::placeholder{color:#728091}.dm-market-search button{height:36px;border:1px solid #a86c27;border-radius:10px;padding:0 13px;background:linear-gradient(135deg,#d98b2d,#efaa4e);color:#10141a;font-size:.73rem;font-weight:900}

      .dm-task-section{margin:0 0 17px}.dm-task-head{margin-bottom:8px}.dm-task-head span,.dm-section-kicker{display:block;margin-bottom:3px;color:#a98355;font-size:.56rem;font-weight:850;text-transform:uppercase;letter-spacing:.08em}.dm-task-head h1{margin:0;color:#fff;font:800 1.18rem/1.08 'Space Grotesk',sans-serif}.dm-task-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.dm-task-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;min-height:66px;padding:9px 10px;border:1px solid #293d4c;border-radius:13px;background:linear-gradient(145deg,#0e1b28,#0a1621);color:#dce5ee;text-decoration:none}.dm-task-card.featured{border-color:#5d472d;background:linear-gradient(145deg,#171a1d,#17130f)}.dm-task-card>i{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#101d28;border:1px solid #304454;color:#b58b58;font-style:normal}.dm-task-card.featured>i{background:#21180f;border-color:#634724;color:#dfa759}.dm-task-card div{min-width:0}.dm-task-card strong,.dm-task-card small{display:block}.dm-task-card strong{color:#f7f9fc;font-size:.72rem;line-height:1.15}.dm-task-card small{margin-top:3px;color:#7f8fa0;font-size:.57rem;line-height:1.22}.dm-task-card>svg{color:#9b7b55;flex:0 0 auto}

      .dm-category-section,.dm-shelf{margin-bottom:18px}.dm-storefront-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:9px;margin-bottom:9px}.dm-storefront-heading h2{margin:0;color:#fff;font:800 1.18rem/1.08 'Space Grotesk',sans-serif}.dm-storefront-heading a{color:#c79454;text-decoration:none;font-size:.66rem;font-weight:800;white-space:nowrap}
      .dm-category-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.dm-category-card{position:relative;aspect-ratio:1/1;border-radius:14px;border:1px solid #293d4c;background:#07111d;overflow:hidden;color:#fff;text-decoration:none;box-shadow:inset 0 1px rgba(255,255,255,.025)}.dm-category-art{position:absolute;inset:0;background-repeat:no-repeat;background-color:#07111d;filter:saturate(.68) brightness(.72) contrast(.96);transform:scale(1.015);transition:.18s ease}.dm-category-card:before{content:"";position:absolute;z-index:1;inset:0;background:linear-gradient(180deg,rgba(5,12,18,.12) 0%,rgba(5,12,18,.22) 46%,rgba(4,10,15,.86) 100%);pointer-events:none}.dm-category-card:after{content:"";position:absolute;z-index:1;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.015);pointer-events:none}.dm-category-card strong{position:absolute;z-index:2;left:5px;right:5px;bottom:7px;text-align:center;color:#edf1f5;font-size:.64rem;line-height:1.08;font-weight:750;text-shadow:0 2px 5px #000}.dm-category-card:hover{border-color:#5e4930}.dm-category-card:hover .dm-category-art{filter:saturate(.78) brightness(.82)}
      .dm-more-cats{display:block;margin:8px auto 0;border:1px solid #3d4245;border-radius:10px;background:#0b141d;color:#bb9462;padding:6px 11px;font-size:.63rem;font-weight:800}

      .dm-horizontal-shelf,.dm-horizontal-services{display:flex;gap:9px;overflow-x:auto;padding:1px 1px 7px;scrollbar-width:none;scroll-snap-type:x proximity}.dm-horizontal-shelf::-webkit-scrollbar,.dm-horizontal-services::-webkit-scrollbar{display:none}
      .dm-product-card{flex:0 0 158px;padding:7px;border-radius:15px;border:1px solid #2d3b46;background:#0d1822;color:#fff;display:flex;flex-direction:column;gap:7px;scroll-snap-align:start}.dm-product-preview{aspect-ratio:1/1;border-radius:11px;background:#07111d;position:relative;overflow:hidden}.dm-preview-link{position:absolute;inset:0;color:inherit;text-decoration:none}.dm-product-art{background-repeat:no-repeat;background-color:#07111d;filter:saturate(.78) brightness(.83)}.dm-product-art:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 48%,rgba(5,10,14,.48))}.dm-product-art-shine{position:absolute;inset:0;background:radial-gradient(circle at 38% 22%,rgba(255,220,169,.08),transparent 34%)}.dm-favorite-mark{position:absolute;right:6px;top:6px;width:29px;height:29px;border-radius:50%;background:#eef1f3;border:1px solid #cfd5da;color:#b98950;display:grid;place-items:center;padding:0;z-index:3}.dm-favorite-mark.active{background:#2b1e0e;border-color:#7b5526}.dm-preview-link>b{position:absolute;z-index:3;left:7px;bottom:7px;padding:3px 6px;border-radius:6px;background:#40372f;border:1px solid #725938;font-size:.53rem}.dm-product-copy{display:grid;gap:5px}.dm-product-title{color:inherit;text-decoration:none}.dm-product-card h3{font-size:.72rem;line-height:1.23;margin:0;min-height:36px}.dm-product-rating{display:flex;align-items:center;gap:3px;font-size:.58rem;color:#8f9aa5}.dm-product-rating>span{color:#dca253}.dm-product-rating b{color:#f1d09d}.dm-price{font-size:.82rem}.dm-product-copy>small{color:#7f8a95;font-size:.58rem}.dm-product-open{display:flex;align-items:center;justify-content:space-between;gap:5px;margin-top:2px;padding:7px 8px;border-radius:9px;border:1px solid #584329;background:#17140f;color:#e7ac61;text-decoration:none;font-size:.63rem;font-weight:900}.dm-skeleton-card{height:250px;opacity:.35;background:linear-gradient(90deg,#0d1822,#152534,#0d1822);background-size:200% 100%;animation:dm-shimmer 1.3s infinite}
      .dm-service-tile{flex:0 0 262px;min-height:132px;display:grid;grid-template-columns:104px 1fr;gap:10px;padding:8px;border:1px solid #2c4050;border-radius:15px;background:#0d1822;color:#fff;text-decoration:none;overflow:hidden;scroll-snap-align:start}.dm-service-picture{width:104px;aspect-ratio:1/1;border-radius:11px;background-repeat:no-repeat;background-color:#07111d;filter:saturate(.72) brightness(.78)}.dm-service-copy{min-width:0;display:flex;flex-direction:column;justify-content:center;gap:4px}.dm-service-copy>span{color:#b98d56;font-size:.53rem;font-weight:850;text-transform:uppercase}.dm-service-copy h3{margin:0;font-size:.78rem;line-height:1.18}.dm-service-copy p{margin:0;color:#8795a5;font-size:.61rem;line-height:1.3}.dm-service-copy strong{color:#fff;font-size:.72rem}.dm-service-copy small{color:#7e8b98;font-size:.58rem}.dm-service-icon-tile{grid-template-columns:58px 1fr;align-items:center}.dm-service-icon-tile .dm-premium-icon{border-radius:15px}
      .dm-home-links{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.dm-home-links a{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:54px;padding:0 13px;border:1px solid #2f414f;border-radius:13px;background:#0c1822;color:#fff;text-decoration:none}.dm-home-links span{font-size:.72rem;font-weight:800}.dm-home-links b{color:#c79454;font-size:.62rem;white-space:nowrap}
      @keyframes dm-shimmer{to{background-position:-200% 0}}
      @media(max-width:760px){.dm-task-grid{grid-template-columns:1fr}.dm-task-card{min-height:58px}.dm-category-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.dm-storefront-heading h2{font-size:1.08rem}.dm-product-card{flex-basis:148px}.dm-home-links{grid-template-columns:1fr}}
      @media(max-width:420px){.dm-market-search{height:48px}.dm-market-search input{height:46px;font-size:.8rem}.dm-market-search button{height:34px;padding:0 11px}.dm-task-head h1{font-size:1.08rem}.dm-task-card{min-height:56px;padding:8px 9px}.dm-task-card>i{width:32px;height:32px}.dm-category-grid{gap:6px}.dm-category-card{border-radius:13px}.dm-category-card strong{font-size:.58rem;bottom:6px}.dm-product-card{flex-basis:142px}.dm-service-tile{flex-basis:245px;grid-template-columns:96px 1fr}.dm-service-picture{width:96px}}
    `}</style>
  </MarketFrame>;
}
