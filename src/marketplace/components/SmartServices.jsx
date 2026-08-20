import { useState } from "react";
import { Link } from "react-router-dom";
import { platformServices, serviceToCartOffer } from "@/services/platformServices";
import { isInCart, toggleCart } from "@/marketplace/services/cartService";

export default function SmartServices() {
  const [, setRevision] = useState(0);
  return <section id="services" className="dm-services" aria-labelledby="dm-services-title">
    <div className="dm-section-head">
      <div>
        <span className="dm-section-kicker"><i className="fa-solid fa-wand-magic-sparkles" /> Умные сервисы ДокМаркет</span>
        <h2 id="dm-services-title" className="market-heading">Не шаблон — готовый результат под вашу ситуацию</h2>
        <p className="market-lead">Сервисы задают нужные вопросы, собирают данные и формируют персональный документ. Досудебка — первый работающий сервис единой платформы.</p>
      </div>
      <Link className="market-primary" to="/dosudebka"><i className="fa-solid fa-scale-balanced" />Открыть Досудебку</Link>
    </div>
    <div className="dm-service-grid">
      {platformServices.map(service => {
        const active = service.status === "active";
        const cartOffer = serviceToCartOffer(service);
        const inCart = cartOffer ? isInCart(cartOffer.id) : false;
        return <article key={service.id} className={`dm-service-card ${active ? "active" : ""} market-glass`}>
          <div className="dm-service-top"><span className="market-icon"><i className={`fa-solid ${service.icon}`} /></span><span className={`dm-service-status ${active ? "active" : ""}`}>{service.statusLabel}</span></div>
          <h3>{service.title}</h3><p>{service.description}</p><small>{service.meta}</small>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginTop:"auto",paddingTop:18}}><strong style={{color:active?"#a5f3fc":"#64748b",fontSize:".76rem"}}>{service.priceLabel}</strong>{active ? <Link className="dm-service-link" to={service.route}>Открыть <i className="fa-solid fa-arrow-right" /></Link> : <span className="dm-service-link">В разработке <i className="fa-solid fa-clock" /></span>}</div>
          {cartOffer && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}><Link className="market-action primary" to={service.actionRoute || service.route}>Начать сейчас</Link><button type="button" className={`market-action ${inCart ? "active" : ""}`} onClick={() => { toggleCart(cartOffer); setRevision(value => value + 1); }}><i className="fa-solid fa-cart-shopping" />{inCart ? "В корзине" : "В корзину"}</button></div>}
        </article>;
      })}
    </div>
  </section>;
}
