import { Link } from "react-router-dom";
import { platformServices } from "@/services/platformServices";

export default function SmartServices() {
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
        const body = <>
          <div className="dm-service-top"><span className="market-icon"><i className={`fa-solid ${service.icon}`} /></span><span className={`dm-service-status ${active ? "active" : ""}`}>{service.statusLabel}</span></div>
          <h3>{service.title}</h3><p>{service.description}</p><small>{service.meta}</small>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginTop:"auto"}}><strong style={{color:active?"#a5f3fc":"#64748b",fontSize:".76rem"}}>{service.priceLabel}</strong><span className="dm-service-link">{active ? "Запустить сервис" : "В разработке"} <i className={`fa-solid ${active ? "fa-arrow-right" : "fa-clock"}`} /></span></div>
        </>;
        return active ? <Link key={service.id} className="dm-service-card active market-glass" to={service.route}>{body}</Link> : <article key={service.id} className="dm-service-card market-glass">{body}</article>;
      })}
    </div>
  </section>;
}
