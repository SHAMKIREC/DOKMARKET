import { Link } from "react-router-dom";
import DocMarketHome from "./DocMarketHome";
import PublicSellerShowcase from "@/marketplace/components/PublicSellerShowcase";

function SmallIcon({type}){
  const p={viewBox:"0 0 48 48",width:32,height:32,fill:"none",stroke:"currentColor",strokeWidth:2.6,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":true};
  if(type==="build")return <svg {...p}><path d="M8 38 28 18M23 8l17 17-8 8-17-17zM7 41h21"/></svg>;
  if(type==="seller")return <svg {...p}><circle cx="24" cy="16" r="8"/><path d="M9 42c1-11 6-17 15-17s14 6 15 17"/><path d="M32 9h9v9"/></svg>;
  if(type==="partners")return <svg {...p}><circle cx="17" cy="18" r="7"/><circle cx="33" cy="19" r="6"/><path d="M5 41c1-10 6-15 12-15s11 5 12 15M29 29c7 0 11 4 13 12"/></svg>;
  return <svg {...p}><path d="M9 7h20l10 10v24H9z"/><path d="M29 7v11h11M15 26h18M15 32h13"/></svg>;
}

const ecosystem = [
  {to:"/seller",type:"seller",eyebrow:"Маркетплейс",title:"Стать селлером",text:"Своя витрина документов и услуг, рейтинг, отзывы и заказы внутри приложения.",action:"Открыть для селлеров"},
  {to:"/partners",type:"partners",eyebrow:"Сотрудничество",title:"Партнёры ДокМаркета",text:"Строительство, разработка и автоматизация вместе с командами-партнёрами.",action:"Смотреть партнёров"},
];

export default function PlatformHome(){
  return <div className="dm-platform-home">
    <style>{`
      .dm-platform-home .market-page{min-height:0!important}.dm-platform-home .market-content{padding-bottom:14px!important}.dm-platform-home{padding-bottom:96px}.dm-market-quick a:nth-child(3) strong{font-size:0}.dm-market-quick a:nth-child(3) strong:after{content:'Селлер';font-size:.78rem}.dm-market-quick a:nth-child(3) small{font-size:0}.dm-market-quick a:nth-child(3) small:after{content:'Кабинет селлера';font-size:.62rem}
      .dm-ecosystem-wrap{width:min(100% - 28px,1180px);margin:8px auto 30px}.dm-ecosystem-head{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:12px}.dm-ecosystem-head span{display:block;color:#25c9e8;font-size:.68rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.dm-ecosystem-head h2{margin:5px 0 0;color:#fff;font-size:1.5rem}.dm-ecosystem-head p{margin:0;max-width:520px;color:#7f91a4;font-size:.75rem;line-height:1.5;text-align:right}.dm-ecosystem{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.dm-ecosystem-card{min-height:190px;padding:16px;border-radius:17px;border:1px solid #263f52;background:#0d1b29;color:#fff;text-decoration:none;display:flex;flex-direction:column;transition:transform .2s,border-color .2s,box-shadow .2s}.dm-ecosystem-card:hover{transform:translateY(-2px);border-color:#3c5b70;box-shadow:0 18px 35px rgba(0,0,0,.18)}.dm-ecosystem-card.orange{border-color:#5a3d1d;background:linear-gradient(145deg,#111b25,#17120c)}.dm-ecosystem-icon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:#172738;color:#25c9e8}.dm-ecosystem-card.orange .dm-ecosystem-icon{background:#21180d;color:#ff9f1c;border:1px solid #5f431f}.dm-ecosystem-copy{display:flex;flex:1;flex-direction:column}.dm-ecosystem-copy>span{margin-top:12px;color:#7f91a4;font-size:.58rem;font-weight:850;text-transform:uppercase;letter-spacing:.08em;line-height:1.35}.dm-ecosystem-copy h3{margin:5px 0 6px;font-size:.95rem}.dm-ecosystem-copy p{margin:0;color:#8fa0b2;font-size:.7rem;line-height:1.45}.dm-ecosystem-copy b{display:block;margin-top:auto;padding-top:12px;color:#25c9e8;font-size:.68rem}.dm-ecosystem-card.orange .dm-ecosystem-copy b{color:#ffad42}
      .dm-ecosystem{grid-template-columns:repeat(2,minmax(0,1fr))}.dm-ecosystem-card{min-height:168px}
      @media(max-width:900px){.dm-ecosystem{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:640px){.dm-ecosystem-wrap{width:calc(100% - 24px);margin-bottom:20px}.dm-ecosystem-head{align-items:flex-start;flex-direction:column}.dm-ecosystem-head p{text-align:left}.dm-ecosystem{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.dm-ecosystem-card{min-height:170px;padding:13px}.dm-ecosystem-icon{width:42px;height:42px}.dm-ecosystem-copy h3{font-size:.82rem}.dm-ecosystem-copy p{font-size:.63rem}.dm-market-quick a:nth-child(3) strong:after{font-size:.68rem}.dm-market-quick a:nth-child(3) small:after{display:none}}
      @media(max-width:390px){.dm-ecosystem{grid-template-columns:1fr}.dm-ecosystem-card{min-height:145px}}
    `}</style>
    <DocMarketHome/>
    <section className="dm-ecosystem-wrap" aria-label="Сервисы и экосистема ДокМаркета">
      <div className="dm-ecosystem-head"><div><span>ДЛЯ СОТРУДНИЧЕСТВА</span><h2>Селлерам и партнёрам</h2></div><p>Публикуйте документы и услуги или развивайте отдельное направление вместе с ДокМаркетом.</p></div>
      <div className="dm-ecosystem">{ecosystem.map(item=><Link key={item.to} className={`dm-ecosystem-card ${item.accent||""}`} to={item.to}><span className="dm-ecosystem-icon"><SmallIcon type={item.type}/></span><div className="dm-ecosystem-copy"><span>{item.eyebrow}</span><h3>{item.title}</h3><p>{item.text}</p><b>{item.action} →</b></div></Link>)}</div>
    </section>
    <PublicSellerShowcase/>
  </div>
}
