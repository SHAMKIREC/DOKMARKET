import { Link } from "react-router-dom";
import { directions } from "@/data/marketplaceMock";
import SmartServices from "@/marketplace/components/SmartServices";
import SmartDocumentFinder from "@/marketplace/components/SmartDocumentFinder";
import SimpleProblemChooser from "@/marketplace/components/SimpleProblemChooser";
import { MarketFrame } from "./Market";

const quickEntries = [
  { title:"Готовые документы", text:"Договоры, претензии, заявления, жалобы и другие файлы.", to:"/market", cta:"Открыть каталог" },
  { title:"Создать по ответам", text:"Ответьте на вопросы — сервис соберёт документ из ваших данных.", to:"/dosudebka", cta:"Открыть Досудебку" },
  { title:"Услуги специалистов", text:"Закажите работу специалиста внутри ДокМаркета, когда готового документа недостаточно.", to:"/market#specialists", cta:"Найти специалиста" },
];

const howItWorks = [
  ["1", "Найдите документ", "По названию, категории или обычному описанию ситуации."],
  ["2", "Посмотрите карточку", "Состав, формат, цена, продавец и то, что вы получите."],
  ["3", "Получите результат", "Покупки, файлы и заказы сохраняются в кабинете ДокМаркета."],
];

export default function DocMarketHome() {
  const activeDirections = directions.filter(item => Number(item.materialsCount || 0) > 0).slice(0, 6);

  return <MarketFrame>
    <section className="market-hero market-glass dm-home-hero">
      <div className="dm-home-copy">
        <span className="market-kicker">Маркетплейс документов и услуг</span>
        <h1 className="market-title">Найдите нужный документ и получите его без лишних шагов</h1>
        <p className="market-subtitle">Готовые документы — основа ДокМаркета. Если готового файла мало, рядом есть автоматические сервисы и специалисты.</p>
        <div className="dm-hero-actions">
          <Link className="market-primary" to="/market"><i className="fa-solid fa-file-lines" />Каталог документов</Link>
          <a className="market-action" href="#smart-find"><i className="fa-solid fa-magnifying-glass" />Помочь выбрать</a>
        </div>
        <div className="market-trust-badges">
          <span className="market-trust-badge">Понятно, что покупаете</span>
          <span className="market-trust-badge">PDF / DOCX</span>
          <span className="market-trust-badge">Покупки в кабинете</span>
          <span className="market-trust-badge">Специалисты внутри платформы</span>
        </div>
      </div>
      <aside className="dm-hero-result">
        <span>Пример товара</span>
        <p>Претензия работодателю</p>
        <strong>Досудебка</strong>
        <small>Ответьте на вопросы и получите документ под свою ситуацию.</small>
        <Link to="/dosudebka">Открыть карточку <i className="fa-solid fa-arrow-right" /></Link>
      </aside>
    </section>

    <section id="directions" className="dm-catalog-preview">
      <div className="dm-section-title"><span className="market-kicker">Документы</span><h2 className="market-heading">Что можно купить сейчас</h2><p className="market-lead">Откройте направление и выберите документ по задаче.</p></div>
      {activeDirections.length ? <div className="market-grid">{activeDirections.map(item => <Link className="market-card market-glass" to={`/market/${item.slug}`} key={item.slug}><span className="market-icon"><i className={`fa-solid ${item.icon}`} /></span><h2>{item.title}</h2><p>{item.description}</p><div className="market-examples">{item.examples?.slice(0,3).map(example => <span className="market-example" key={example}>{example}</span>)}</div><span className="market-card-link">Смотреть документы <i className="fa-solid fa-arrow-right" /></span></Link>)}</div> : <div className="market-empty market-glass">Сейчас опубликована Досудебка. Остальные карточки появятся после подготовки материалов.</div>}
      <div className="dm-center-action"><Link className="market-primary" to="/market">Открыть весь каталог</Link></div>
    </section>

    <div id="smart-find"><SmartDocumentFinder /></div>
    <SimpleProblemChooser />

    <section className="dm-choice-section">
      <div className="dm-section-title"><span className="market-kicker">Если нужен другой путь</span><h2 className="market-heading">Документ, сервис или специалист</h2><p className="market-lead">Начинайте с готового документа. Более сложную работу можно передать специалисту.</p></div>
      <div className="market-grid">{quickEntries.map(item => <Link className="market-card market-glass dm-choice-card" to={item.to} key={item.title}><h2>{item.title}</h2><p>{item.text}</p><span className="market-card-link">{item.cta} <i className="fa-solid fa-arrow-right" /></span></Link>)}</div>
    </section>

    <SmartServices />

    <section className="dm-how market-panel market-glass"><span className="market-kicker">Как купить</span><h2 className="market-heading">Три понятных шага</h2><div className="dm-how-grid">{howItWorks.map(([number,title,text]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>

    <section className="dm-business-model market-panel market-glass">
      <div><span className="market-kicker">Услуги специалистов</span><h2 className="market-heading">Вся работа остаётся в заказе</h2><p className="market-lead">Задача, результат и статус заказа фиксируются в ДокМаркете. Платёжную механику и выплаты специалистам подключим отдельным этапом.</p></div>
      <div className="dm-flow"><span>Заказ</span><i className="fa-solid fa-arrow-right" /><span>Работа</span><i className="fa-solid fa-arrow-right" /><span>Результат</span><i className="fa-solid fa-arrow-right" /><span>Подтверждение</span></div>
    </section>
  </MarketFrame>;
}
