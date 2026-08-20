import { Link } from "react-router-dom";
import { directions } from "@/data/marketplaceMock";
import SmartServices from "@/marketplace/components/SmartServices";
import SimpleProblemChooser from "@/marketplace/components/SimpleProblemChooser";
import { MarketFrame } from "./Market";

const quickEntries = [
  { icon: "fa-file-lines", title: "Готовый документ", text: "Знаете, что нужно? Найдите договор, заявление, жалобу или шаблон.", to: "/market", cta: "Найти документ", note:"самый простой вариант" },
  { icon: "fa-wand-magic-sparkles", title: "Сервис сделает за вас", text: "Ответьте на вопросы — получите готовый документ под вашу ситуацию.", to: "/#services", cta: "Запустить сервис", note:"меньше ручной работы" },
  { icon: "fa-user-tie", title: "Нужен специалист", text: "Если ситуация сложная — выберите человека, который проверит или сделает под ключ.", to: "/market#specialists", cta: "Найти специалиста", note:"индивидуальная помощь" },
];

const howItWorks = [
  ["1", "Выберите проблему", "Напишите или выберите, что случилось."],
  ["2", "Выберите способ", "Документ, сервис или специалист."],
  ["3", "Получите результат", "Готовое сохраняется в вашем кабинете."],
];

export default function DocMarketHome() {
  const activeDirections = directions.filter(item => Number(item.materialsCount || 0) > 0).slice(0, 6);
  return <MarketFrame>
    <section className="market-hero market-glass dm-home-hero">
      <div className="dm-home-copy">
        <span className="market-kicker"><i className="fa-solid fa-cubes" /> ДокМаркет</span>
        <h1 className="market-title">Есть проблема? Поможем понять, какой документ нужен.</h1>
        <p className="market-subtitle">Выберите, что случилось. ДокМаркет покажет простой следующий шаг без сложных юридических слов.</p>
        <div className="dm-hero-actions">
          <a className="market-primary" href="#start"><i className="fa-solid fa-route" />Выбрать проблему</a>
          <Link className="market-action" to="/dosudebka"><i className="fa-solid fa-scale-balanced" />Создать претензию</Link>
          <Link className="market-action dm-desktop-secondary" to="/market"><i className="fa-solid fa-folder-open" />Каталог</Link>
        </div>
        <div className="market-trust-badges">
          <span className="market-trust-badge"><i className="fa-solid fa-language" />Понятно</span>
          <span className="market-trust-badge"><i className="fa-solid fa-file-word" />PDF / DOCX</span>
          <span className="market-trust-badge"><i className="fa-solid fa-folder-open" />В кабинете</span>
          <span className="market-trust-badge"><i className="fa-solid fa-lock" />Приватно</span>
        </div>
      </div>
      <aside className="dm-hero-result">
        <span>Пример</span>
        <p>«Мне не выплатили зарплату»</p>
        <i className="fa-solid fa-arrow-down" />
        <strong>Досудебка</strong>
        <small>Ответьте на вопросы и получите готовую претензию в PDF/DOCX.</small>
        <Link to="/dosudebka">Попробовать <i className="fa-solid fa-arrow-right" /></Link>
      </aside>
    </section>

    <SimpleProblemChooser />

    <section className="dm-choice-section">
      <div className="dm-section-title"><span className="market-kicker"><i className="fa-solid fa-layer-group" />Как решить</span><h2 className="market-heading">Три понятных варианта</h2><p className="market-lead">Выберите, сколько помощи вам нужно.</p></div>
      <div className="market-grid">
        {quickEntries.map(item => <Link className="market-card market-glass dm-choice-card" to={item.to} key={item.title}>
          <span className="market-icon"><i className={`fa-solid ${item.icon}`} /></span>
          <small className="dm-card-note">{item.note}</small><h2>{item.title}</h2><p>{item.text}</p>
          <span className="market-card-link">{item.cta} <i className="fa-solid fa-arrow-right" /></span>
        </Link>)}
      </div>
    </section>

    <SmartServices />

    <section className="dm-how market-panel market-glass">
      <span className="market-kicker"><i className="fa-solid fa-check-double" />Как это работает</span>
      <h2 className="market-heading">Всего три шага</h2>
      <div className="dm-how-grid">{howItWorks.map(([number,title,text])=><article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
    </section>

    <section id="directions" className="dm-catalog-preview">
      <div className="dm-section-title"><span className="market-kicker"><i className="fa-solid fa-folder-tree" />Каталог</span><h2 className="market-heading">Готовые направления</h2><p className="market-lead">Показываем только разделы, где уже есть решения.</p></div>
      {activeDirections.length ? <div className="market-grid">{activeDirections.map(item => <Link className="market-card market-glass" to={`/market/${item.slug}`} key={item.slug}><span className="market-icon"><i className={`fa-solid ${item.icon}`} /></span><h2>{item.title}</h2><p>{item.description}</p><div className="market-examples">{item.examples?.slice(0,3).map(example => <span className="market-example" key={example}>{example}</span>)}</div><span className="market-card-link">Посмотреть <i className="fa-solid fa-arrow-right" /></span></Link>)}</div> : <div className="market-empty market-glass">Сейчас доступна Досудебка. Каталог пополняется.</div>}
      <div className="dm-center-action"><Link className="market-action" to="/market">Весь каталог <i className="fa-solid fa-arrow-right" /></Link></div>
    </section>

    <section className="dm-business-model market-panel market-glass">
      <div><span className="market-kicker"><i className="fa-solid fa-store" />Одна платформа</span><h2 className="market-heading">Следующий шаг всегда рядом</h2><p className="market-lead">Документ → сервис → проверка → специалист. Всё остаётся в одном ДокМаркете.</p></div>
      <div className="dm-flow"><span>Документ</span><i className="fa-solid fa-arrow-right"/><span>Сервис</span><i className="fa-solid fa-arrow-right"/><span>Проверка</span><i className="fa-solid fa-arrow-right"/><span>Специалист</span></div>
    </section>
  </MarketFrame>;
}
