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

const categories=[
  {title:"Юридические",slug:"legal",icon:"legal"},
  {title:"Договоры",slug:"contracts",icon:"contracts"},
  {title:"Бухгалтерия",slug:"accounting",icon:"accounting"},
  {title:"Бизнес и ИП",slug:"business",icon:"business"},
  {title:"Кадры и HR",slug:"hr",icon:"hr"},
  {title:"Недвижимость",slug:"realty",icon:"realty"},
  {title:"Авто",slug:"auto",icon:"auto"},
  {title:"Образование",slug:"education",icon:"education"},
  {title:"Медицина",slug:"medicine",icon:"medicine"},
  {title:"Фриланс",slug:"freelance",icon:"freelance"},
  {title:"Маркетплейсы",slug:"marketplaces",icon:"marketplaces"},
  {title:"Инструкции",slug:"guides",icon:"guides"},
  {title:"AI и технологии",slug:"ai",icon:"ai"},
  {title:"Чек-листы",slug:"checklists",icon:"checklists"}
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
  return {backgroundImage:`url(${CATEGORY_SPRITE})`,backgroundSize:"400% 400%",backgroundPosition:`${POS[c.x]}% ${POS[c.y]}%`};
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
      <Link className="dm-preview-link dm-product-art" style={artStyle(slug)} to={to} aria-label={item.title}><b>{format}</b></Link>
      {!item.previewOnly&&<button className={`dm-favorite-mark ${favorite?"active":""}`} type="button" aria-label={favorite?"Убрать из избранного":"Добавить в избранное"} onClick={()=>{toggleFavorite(item.id,"offer");refresh(v=>v+1)}}><MiniIcon type="heart" size={14} filled={favorite}/></button>}
    </div>
    <div className="dm-product-copy">
      <Link className="dm-product-title" to={to}><h3>{item.title}</h3></Link>
      {rating>0&&reviewCount>0&&<div className="dm-product-rating"><span>★</span><b>{rating.toFixed(1)}</b><small>({reviewCount})</small></div>}
      <div className="dm-product-meta"><strong className="dm-price">{item.previewOnly?"Открыть":money(item)}</strong><small>{item.providerName||"ДокМаркет"}</small></div>
      <Link className="dm-product-open" to={to} aria-label={`Открыть ${item.title}`}><MiniIcon type="arrow" size={15}/></Link>
    </div>
  </article>;
}

function ServiceCard({to,slug,title,copy,price}){
  return <Link className="dm-service-tile" to={to}>
    <div className="dm-service-picture" style={artStyle(slug)}/>
    <div className="dm-service-copy"><span>Сервис ДокМаркета</span><h3>{title}</h3><p>{copy}</p><strong>{price}</strong></div>
    <MiniIcon type="arrow" size={17}/>
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
  const visibleDocuments=documents.length?documents.slice(0,6):fallbackDocuments;
  const visibleCategories=showAll?categories:categories.slice(0,6);

  function submitSearch(e){e.preventDefault();const q=query.trim();navigate(q?`/market?q=${encodeURIComponent(q)}`:"/market")}

  return <MarketFrame>
    <style>{docMarketIconStyles}</style>

    <section className="dm-market-top">
      <form className="dm-market-search" onSubmit={submitSearch}>
        <MiniIcon type="search" size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Документ, услуга или вопрос" aria-label="Поиск по ДокМаркету"/><button type="submit">Найти</button>
      </form>
    </section>

    <section className="dm-task-section" aria-label="Быстрый выбор задачи">
      <div className="dm-task-head"><span>Начните с задачи</span><h1>Что вам нужно?</h1></div>
      <div className="dm-task-grid">
        <Link className="dm-task-card" to="/market?type=document"><i><MiniIcon type="document" size={19}/></i><div><strong>Найти документ</strong><small>Шаблоны и готовые файлы</small></div><MiniIcon type="arrow" size={16}/></Link>
        <Link className="dm-task-card featured" to="/dosudebka"><i><MiniIcon type="magic" size={19}/></i><div><strong>Составить претензию</strong><small>Сервис соберёт её по ответам</small></div><MiniIcon type="arrow" size={16}/></Link>
        <Link className="dm-task-card" to="/market?type=service"><i><MiniIcon type="person" size={19}/></i><div><strong>Найти услугу</strong><small>Сервисы и специалисты</small></div><MiniIcon type="arrow" size={16}/></Link>
      </div>
    </section>

    <section className="dm-category-section">
      <div className="dm-storefront-heading"><div><span className="dm-section-kicker">По типу документа</span><h2>Категории</h2></div><Link to="/market?type=document">Все категории</Link></div>
      <div className="dm-category-grid">{visibleCategories.map(c=><Link className="dm-category-card" to={categoryHref(c)} key={c.slug}><span className="dm-category-icon"><DocMarketIcon name={c.icon} size={28}/></span><strong>{c.title}</strong><MiniIcon type="arrow" size={14}/></Link>)}</div>
      <button type="button" className="dm-more-cats" onClick={()=>setShowAll(v=>!v)}>{showAll?"Скрыть категории":"Показать ещё"}</button>
    </section>

    <section className="dm-shelf">
      <div className="dm-storefront-heading"><h2>Популярные документы</h2><Link to="/market?type=document">Все документы</Link></div>
      <div className="dm-product-grid">{loading?[1,2,3,4].map(x=><div className="dm-product-card dm-skeleton-card" key={x}/>):visibleDocuments.map(item=><ProductCard key={item.id} item={item}/>)}</div>
    </section>

    <section className="dm-shelf" id="services">
      <div className="dm-storefront-heading"><div><span className="dm-section-kicker">Инструменты</span><h2>Сервисы ДокМаркета</h2></div><Link to="/market?type=service">Все сервисы</Link></div>
      <div className="dm-service-list">
        <ServiceCard to="/dosudebka" slug="dosudebka" title="Досудебка" copy="Соберёт претензию под вашу ситуацию." price="от 490 ₽"/>
        <ServiceCard to="/construction-docs" slug="realty" title="Строительная документация" copy="ППР, акты, журналы и автоматизация." price="Открыть"/>
        {serviceItems.slice(0,2).map(item=><Link className="dm-service-tile dm-service-icon-tile" key={item.id} to={item.actionUrl||item.route||`/market/offer/${item.id}`}><span className="dm-service-premium"><DocMarketIcon name="services" size={30}/></span><div className="dm-service-copy"><span>Сервис</span><h3>{item.title}</h3><strong>{money(item)}</strong></div><MiniIcon type="arrow" size={17}/></Link>)}
      </div>
    </section>

    <section className="dm-home-links">
      <Link to="/reviews"><span>Отзывы</span><b>Покупатели о ДокМаркете</b><MiniIcon type="arrow" size={15}/></Link>
      <Link to="/partners"><span>Партнёры</span><b>Программа сотрудничества</b><MiniIcon type="arrow" size={15}/></Link>
    </section>

    <style>{`
      .dm-market-top{margin:4px 0 14px}.dm-market-search{display:grid;grid-template-columns:auto 1fr auto;align-items:center;height:50px;padding:0 6px 0 13px;border:1px solid #2b4050;border-radius:14px;background:#0b1722;color:#c58a42}.dm-market-search input{height:48px;border:0;outline:0;background:transparent;color:#fff;padding:0 10px;font-size:.86rem;min-width:0}.dm-market-search input::placeholder{color:#768596}.dm-market-search button{height:36px;border:1px solid #a86c27;border-radius:10px;padding:0 14px;background:linear-gradient(135deg,#d98b2d,#efaa4e);color:#10141a;font-size:.72rem;font-weight:900}
      .dm-task-section{margin-bottom:18px}.dm-task-head{margin-bottom:8px}.dm-task-head span,.dm-section-kicker{display:block;margin-bottom:3px;color:#a98355;font-size:.55rem;font-weight:850;text-transform:uppercase;letter-spacing:.08em}.dm-task-head h1{margin:0;color:#fff;font:800 1.18rem/1.08 'Space Grotesk',sans-serif}.dm-task-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.dm-task-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;min-height:62px;padding:8px 10px;border:1px solid #293d4c;border-radius:13px;background:#0c1925;color:#dce5ee;text-decoration:none}.dm-task-card.featured{border-color:#60492d;background:#15140f}.dm-task-card>i{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#101d28;border:1px solid #304454;color:#b58b58;font-style:normal}.dm-task-card.featured>i{background:#21180f;border-color:#634724;color:#dfa759}.dm-task-card strong,.dm-task-card small{display:block}.dm-task-card strong{color:#f7f9fc;font-size:.72rem;line-height:1.15}.dm-task-card small{margin-top:3px;color:#7f8fa0;font-size:.57rem;line-height:1.22}.dm-task-card>svg{color:#987753}
      .dm-category-section,.dm-shelf{margin-bottom:20px}.dm-storefront-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:9px}.dm-storefront-heading h2{margin:0;color:#fff;font:800 1.15rem/1.08 'Space Grotesk',sans-serif}.dm-storefront-heading a{color:#c79454;text-decoration:none;font-size:.64rem;font-weight:800;white-space:nowrap}.dm-category-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.dm-category-card{min-height:64px;display:grid;grid-template-columns:36px 1fr 14px;align-items:center;gap:7px;padding:8px 9px;border-radius:12px;border:1px solid #293d4c;background:#0b1722;color:#fff;text-decoration:none}.dm-category-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#131b22;border:1px solid #3a3d3f;color:#c49458}.dm-category-icon .dm-premium-icon{width:30px!important;height:30px!important;border:0!important;background:none!important;box-shadow:none!important}.dm-category-card strong{font-size:.67rem;line-height:1.1;font-weight:760}.dm-category-card>svg{color:#6f7e8c}.dm-more-cats{display:block;margin:8px auto 0;border:1px solid #3d4245;border-radius:10px;background:#0b141d;color:#bb9462;padding:6px 11px;font-size:.62rem;font-weight:800}
      .dm-product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.dm-product-card{min-width:0;padding:7px;border-radius:14px;border:1px solid #2d3b46;background:#0d1822;color:#fff;display:grid;grid-template-columns:92px 1fr;gap:9px;align-items:stretch}.dm-product-preview{width:92px;aspect-ratio:1/1;border-radius:10px;background:#07111d;position:relative;overflow:hidden}.dm-preview-link{position:absolute;inset:0;color:inherit;text-decoration:none}.dm-product-art{background-repeat:no-repeat;background-color:#07111d;filter:saturate(.7) brightness(.76)}.dm-product-art:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(5,10,14,.42))}.dm-favorite-mark{position:absolute;right:5px;top:5px;width:25px;height:25px;border-radius:50%;background:#eef1f3;border:1px solid #cfd5da;color:#b98950;display:grid;place-items:center;padding:0;z-index:3}.dm-preview-link>b{position:absolute;z-index:3;left:6px;bottom:6px;padding:2px 5px;border-radius:6px;background:#40372f;border:1px solid #725938;font-size:.48rem}.dm-product-copy{min-width:0;display:flex;flex-direction:column;gap:5px}.dm-product-title{color:inherit;text-decoration:none}.dm-product-card h3{font-size:.72rem;line-height:1.22;margin:1px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.dm-product-rating{display:flex;align-items:center;gap:3px;font-size:.56rem;color:#8f9aa5}.dm-product-rating>span{color:#dca253}.dm-product-meta{margin-top:auto;display:grid;gap:1px}.dm-price{font-size:.78rem}.dm-product-meta small{color:#7f8a95;font-size:.55rem}.dm-product-open{position:absolute;right:8px;bottom:8px;width:28px;height:28px;display:grid;place-items:center;border-radius:8px;border:1px solid #584329;background:#17140f;color:#e7ac61;text-decoration:none}.dm-product-card{position:relative}.dm-skeleton-card{height:110px;opacity:.35;background:linear-gradient(90deg,#0d1822,#152534,#0d1822);background-size:200% 100%;animation:dm-shimmer 1.3s infinite}
      .dm-service-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.dm-service-tile{min-height:92px;display:grid;grid-template-columns:72px 1fr 18px;align-items:center;gap:10px;padding:8px;border:1px solid #2c4050;border-radius:14px;background:#0d1822;color:#fff;text-decoration:none;overflow:hidden}.dm-service-picture{width:72px;height:72px;border-radius:10px;background-repeat:no-repeat;background-color:#07111d;filter:saturate(.62) brightness(.7)}.dm-service-copy{min-width:0;display:flex;flex-direction:column;justify-content:center;gap:3px}.dm-service-copy>span{color:#b98d56;font-size:.5rem;font-weight:850;text-transform:uppercase}.dm-service-copy h3{margin:0;font-size:.75rem;line-height:1.15}.dm-service-copy p{margin:0;color:#8795a5;font-size:.58rem;line-height:1.3}.dm-service-copy strong{color:#fff;font-size:.68rem}.dm-service-tile>svg{color:#8c7559}.dm-service-premium{width:48px;height:48px;display:grid;place-items:center}.dm-service-icon-tile{grid-template-columns:58px 1fr 18px}
      .dm-home-links{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.dm-home-links a{display:grid;grid-template-columns:auto 1fr 15px;align-items:center;gap:8px;min-height:48px;padding:8px 11px;border:1px solid #2f414f;border-radius:12px;background:#0c1822;color:#fff;text-decoration:none}.dm-home-links span{font-size:.7rem;font-weight:850}.dm-home-links b{color:#8090a1;font-size:.57rem;font-weight:650}.dm-home-links svg{color:#b58b58}@keyframes dm-shimmer{to{background-position:-200% 0}}
      @media(max-width:980px){.dm-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dm-service-list{grid-template-columns:1fr}}
      @media(max-width:760px){.dm-task-grid{grid-template-columns:1fr}.dm-task-card{min-height:54px}.dm-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dm-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dm-product-card{grid-template-columns:1fr;gap:6px;padding:6px}.dm-product-preview{width:100%;aspect-ratio:1.22/1}.dm-product-card h3{font-size:.66rem;min-height:32px}.dm-product-meta{padding-right:30px}.dm-product-open{right:7px;bottom:7px}.dm-home-links{grid-template-columns:1fr 1fr}.dm-home-links a{grid-template-columns:1fr 14px}.dm-home-links b{display:none}.dm-category-section,.dm-shelf{margin-bottom:17px}}
      @media(max-width:420px){.dm-market-search{height:47px}.dm-market-search input{height:45px;font-size:.79rem}.dm-market-search button{height:33px;padding:0 10px}.dm-task-head h1{font-size:1.05rem}.dm-category-card{min-height:58px;grid-template-columns:32px 1fr 12px;padding:7px}.dm-category-icon{width:32px;height:32px}.dm-category-icon .dm-premium-icon{width:26px!important;height:26px!important}.dm-category-card strong{font-size:.62rem}.dm-storefront-heading h2{font-size:1rem}.dm-product-preview{aspect-ratio:1.14/1}.dm-service-tile{grid-template-columns:64px 1fr 16px}.dm-service-picture{width:64px;height:64px}.dm-home-links a{min-height:44px;padding:7px 9px}}
    `}</style>
  </MarketFrame>;
}
