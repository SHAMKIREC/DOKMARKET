import { Link } from "react-router-dom";
import { directions } from "@/data/marketplaceMock";
import SmartServices from "@/marketplace/components/SmartServices";
import { MarketFrame } from "./Market";

const quickEntries = [
  { icon: "fa-file-lines", title: "Готовые документы", text: "Шаблоны, инструкции и комплекты от платформы и специалистов.", to: "/market", cta: "Открыть каталог" },
  { icon: "fa-wand-magic-sparkles", title: "Умные сервисы", text: "Ответьте на вопросы — сервис сам соберёт документ под вашу ситуацию.", to: "/#services", cta: "Смотреть сервисы" },
  { icon: "fa-user-tie", title: "Специалисты", text: "Когда нужен человек: проверка, консультация или подготовка под ключ.", to: "/market#specialists", cta: "Найти специалиста" },
];

export default function DocMarketHome() {
  return <MarketFrame>
    <section className="market-hero market-glass" style={{ marginBottom: 28 }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 980 }}>
        <span className="market-kicker"><i className="fa-solid fa-cubes" /> Единая платформа документов</span>
        <h1 className="market-title">Документы, умные сервисы и специалисты — в одном ДокМаркете</h1>
        <p className="market-subtitle">Опишите задачу, выберите готовое решение или запустите сервис, который соберёт документ за вас.</p>
        <p className="market-copy">ДокМаркет объединяет каталог документов, автоматизированные сервисы, корзину, кабинет и помощь специалистов. Досудебка — первый полноценный сервис внутри платформы.</p>
        <div style={{ display:"flex",flexWrap:"wrap",gap:10,marginTop:22 }}>
          <Link className="market-primary" to="/dosudebka"><i className="fa-solid fa-scale-balanced" />Создать претензию</Link>
          <Link className="market-action" style={{minHeight:46,padding:"12px 17px"}} to="/market"><i className="fa-solid fa-folder-open" />Каталог документов</Link>
          <Link className="market-action" style={{minHeight:46,padding:"12px 17px"}} to="/Dashboard"><i className="fa-regular fa-user" />Мой кабинет</Link>
        </div>
        <div className="market-trust-badges">
          <span className="market-trust-badge"><i className="fa-solid fa-layer-group" />Один аккаунт</span>
          <span className="market-trust-badge"><i className="fa-solid fa-cart-shopping" />Одна корзина</span>
          <span className="market-trust-badge"><i className="fa-solid fa-folder-open" />Все документы в кабинете</span>
          <span className="market-trust-badge"><i className="fa-solid fa-shield-halved" />Приватное хранение файлов</span>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: 34 }}>
      <div className="market-grid">
        {quickEntries.map(item => <Link className="market-card market-glass" to={item.to} key={item.title}>
          <span className="market-icon"><i className={`fa-solid ${item.icon}`} /></span>
          <h2>{item.title}</h2><p>{item.text}</p>
          <span className="market-card-link">{item.cta} <i className="fa-solid fa-arrow-right" /></span>
        </Link>)}
      </div>
    </section>

    <SmartServices />

    <section id="directions" style={{ marginTop: 42 }}>
      <h2 className="market-heading">Документы по направлениям</h2>
      <p className="market-lead">Если автоматизация не нужна, начните с каталога и выберите готовый материал, онлайн-форму или услугу.</p>
      <div className="market-grid">
        {directions.slice(0, 6).map(item => <Link className="market-card market-glass" to={`/market/${item.slug}`} key={item.slug}>
          <span className="market-icon"><i className={`fa-solid ${item.icon}`} /></span>
          <h2>{item.title}</h2><p>{item.description}</p>
          <div className="market-examples">{item.examples?.slice(0,3).map(example => <span className="market-example" key={example}>{example}</span>)}</div>
          <span className="market-card-link">Открыть направление <i className="fa-solid fa-arrow-right" /></span>
        </Link>)}
      </div>
      <div style={{ display:"flex",justifyContent:"center",marginTop:20 }}><Link className="market-action" style={{padding:"11px 16px"}} to="/market">Все направления <i className="fa-solid fa-arrow-right" /></Link></div>
    </section>

    <section className="market-panel market-glass" style={{ marginTop:42, textAlign:"center" }}>
      <span className="market-kicker"><i className="fa-solid fa-diagram-project" /> Платформа растёт модульно</span>
      <h2 className="market-heading">Сегодня Досудебка. Дальше — новые автоматизированные сервисы.</h2>
      <p className="market-lead" style={{maxWidth:820,margin:"0 auto 20px"}}>Каждый новый сервис будет использовать общее ядро ДокМаркета: аккаунт, документы, файлы, корзину, оплату и историю. Пользователю не придётся регистрироваться заново или привыкать к другому сайту.</p>
      <Link className="market-primary" to="/#services">Посмотреть сервисы</Link>
    </section>
  </MarketFrame>;
}
