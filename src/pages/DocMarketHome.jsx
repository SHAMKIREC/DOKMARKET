import { Link } from "react-router-dom";
import { directions } from "@/data/marketplaceMock";
import SmartServices from "@/marketplace/components/SmartServices";
import SmartDocumentFinder from "@/marketplace/components/SmartDocumentFinder";
import SimpleProblemChooser from "@/marketplace/components/SimpleProblemChooser";
import { MarketFrame } from "./Market";

const quickEntries = [
  { icon:"fa-file-lines", title:"Готовый документ", text:"Найдите договор, заявление, жалобу или другой готовый файл.", to:"/market", cta:"Найти документ", note:"если знаете, что нужно" },
  { icon:"fa-wand-magic-sparkles", title:"Заполнить по шагам", text:"Ответьте на вопросы. Сервис соберёт документ из ваших данных.", to:"/#services", cta:"Открыть сервисы", note:"если нужна помощь с заполнением" },
  { icon:"fa-user-tie", title:"Помощь специалиста", text:"Выберите проверку документа, консультацию или работу под ключ.", to:"/market#specialists", cta:"Найти специалиста", note:"если случай сложный" },
];

const howItWorks = [
  ["1", "Опишите задачу", "Можно написать обычными словами."],
  ["2", "Выберите вариант", "Готовый файл, сервис или специалист."],
  ["3", "Получите результат", "Покупки и созданные документы сохраняются в кабинете."],
];

export default function DocMarketHome() {
  const activeDirections = directions.filter(item => Number(item.materialsCount || 0) > 0).slice(0, 6);
  return <MarketFrame>
    <section className="market-hero market-glass dm-home-hero">
      <div className="dm-home-copy">
        <span className="market-kicker"><i className="fa-solid fa-cubes" /> ДокМаркет</span>
        <h1 className="market-title">Что случилось? Найдём подходящий документ или сервис.</h1>
        <p className="market-subtitle">Опишите задачу своими словами. ДокМаркет покажет подходящие варианты и объяснит, что вы получите.</p>
        <div className="dm-hero-actions"><a className="market-primary" href="#smart-find"><i className="fa-solid fa-message" />Описать ситуацию</a><Link className="market-action" to="/market"><i className="fa-solid fa-folder-open" />Открыть каталог</Link></div>
        <div className="market-trust-badges"><span className="market-trust-badge"><i className="fa-solid fa-language" />Понятные объяснения</span><span className="market-trust-badge"><i className="fa-solid fa-eye" />Образец до покупки</span><span className="market-trust-badge"><i className="fa-solid fa-file-word" />PDF / DOCX</span><span className="market-trust-badge"><i className="fa-solid fa-lock" />Личный кабинет</span></div>
      </div>
      <aside className="dm-hero-result"><span>Например</span><p>«Мне не выплатили зарплату»</p><i className="fa-solid fa-arrow-down" /><strong>Претензия работодателю</strong><small>Откройте Досудебку, ответьте на вопросы и соберите документ.</small><Link to="/dosudebka">Открыть Досудебку <i className="fa-solid fa-arrow-right" /></Link></aside>
    </section>

    <div id="smart-find"><SmartDocumentFinder /></div>
    <SimpleProblemChooser />

    <section className="dm-choice-section"><div className="dm-section-title"><span className="market-kicker"><i className="fa-solid fa-layer-group" />Варианты</span><h2 className="market-heading">Сколько помощи вам нужно?</h2><p className="market-lead">Выберите готовый файл, заполнение по шагам или специалиста.</p></div><div className="market-grid">{quickEntries.map(item => <Link className="market-card market-glass dm-choice-card" to={item.to} key={item.title}><span className="market-icon"><i className={`fa-solid ${item.icon}`} /></span><small className="dm-card-note">{item.note}</small><h2>{item.title}</h2><p>{item.text}</p><span className="market-card-link">{item.cta} <i className="fa-solid fa-arrow-right" /></span></Link>)}</div></section>

    <SmartServices />

    <section className="dm-how market-panel market-glass"><span className="market-kicker"><i className="fa-solid fa-check-double" />Как работает</span><h2 className="market-heading">Три шага</h2><div className="dm-how-grid">{howItWorks.map(([number,title,text]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>

    <section id="directions" className="dm-catalog-preview"><div className="dm-section-title"><span className="market-kicker"><i className="fa-solid fa-folder-tree" />Каталог</span><h2 className="market-heading">Ищете конкретный документ?</h2><p className="market-lead">Откройте направление, прочитайте описание и посмотрите образец.</p></div>{activeDirections.length ? <div className="market-grid">{activeDirections.map(item => <Link className="market-card market-glass" to={`/market/${item.slug}`} key={item.slug}><span className="market-icon"><i className={`fa-solid ${item.icon}`} /></span><h2>{item.title}</h2><p>{item.description}</p><div className="market-examples">{item.examples?.slice(0,3).map(example => <span className="market-example" key={example}>{example}</span>)}</div><span className="market-card-link">Посмотреть <i className="fa-solid fa-arrow-right" /></span></Link>)}</div> : <div className="market-empty market-glass">Сейчас доступна Досудебка. Новые документы добавим после проверки.</div>}<div className="dm-center-action"><Link className="market-action" to="/market">Весь каталог <i className="fa-solid fa-arrow-right" /></Link></div></section>

    <section className="dm-business-model market-panel market-glass"><div><span className="market-kicker"><i className="fa-solid fa-arrow-right" />После документа</span><h2 className="market-heading">Что делать дальше</h2><p className="market-lead">В карточке покажем следующий документ, проверку или специалиста. Покупки и созданные файлы сохраняются в кабинете.</p></div><div className="dm-flow"><span>Документ</span><i className="fa-solid fa-arrow-right" /><span>Следующий шаг</span><i className="fa-solid fa-arrow-right" /><span>Проверка</span><i className="fa-solid fa-arrow-right" /><span>Специалист</span></div></section>
  </MarketFrame>;
}
