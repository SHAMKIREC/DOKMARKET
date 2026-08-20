import { Link } from "react-router-dom";

const services = [
  {
    id: "dosudebka",
    status: "Работает",
    icon: "fa-scale-balanced",
    title: "Досудебка",
    text: "Собирает досудебную претензию под вашу ситуацию: трудовой спор, товар, онлайн-курс или долг.",
    meta: "SOLO и совместная претензия · PDF/DOCX",
    to: "/dosudebka",
    active: true,
  },
  { id: "contract", status: "Скоро", icon: "fa-file-signature", title: "Конструктор договора", text: "Ответьте на вопросы — сервис соберёт договор под ваши условия.", meta: "Договоры для частных лиц и бизнеса" },
  { id: "debt", status: "Скоро", icon: "fa-hand-holding-dollar", title: "Вернуть долг", text: "Маршрут документов от требования должнику до подготовки следующего шага.", meta: "Расписки · займы · расчёты" },
  { id: "complaint", status: "Скоро", icon: "fa-building-shield", title: "Жалобы и обращения", text: "Подберёт адресата и сформирует обращение по вашей ситуации.", meta: "Ведомства · организации · надзор" },
];

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
      {services.map(service => {
        const body = <>
          <div className="dm-service-top"><span className="market-icon"><i className={`fa-solid ${service.icon}`} /></span><span className={`dm-service-status ${service.active ? "active" : ""}`}>{service.status}</span></div>
          <h3>{service.title}</h3><p>{service.text}</p><small>{service.meta}</small>
          <span className="dm-service-link">{service.active ? "Запустить сервис" : "В разработке"} <i className={`fa-solid ${service.active ? "fa-arrow-right" : "fa-clock"}`} /></span>
        </>;
        return service.active ? <Link key={service.id} className="dm-service-card active market-glass" to={service.to}>{body}</Link> : <article key={service.id} className="dm-service-card market-glass">{body}</article>;
      })}
    </div>
  </section>;
}
