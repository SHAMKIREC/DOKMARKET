import { Link } from "react-router-dom";
import { directions } from "@/data/marketplaceMock";
import SmartServices from "@/marketplace/components/SmartServices";
import SimpleProblemChooser from "@/marketplace/components/SimpleProblemChooser";
import { MarketFrame } from "./Market";

const quickEntries = [
  { icon: "fa-file-lines", title: "Готовый документ", text: "Если знаете, что нужно: договор, заявление, жалоба, расписка, инструкция.", to: "/market", cta: "Найти документ", note:"от простого шаблона" },
  { icon: "fa-wand-magic-sparkles", title: "Сервис соберёт за вас", text: "Отвечаете на понятные вопросы — получаете персональный PDF/DOCX.", to: "/#services", cta: "Запустить сервис", note:"меньше ручной работы" },
  { icon: "fa-user-tie", title: "Помощь специалиста", text: "Если ситуация сложная или хотите, чтобы человек проверил и сделал под ключ.", to: "/market#specialists", cta: "Выбрать специалиста", note:"индивидуальная помощь" },
];

const howItWorks = [
  ["1", "Выберите проблему", "Обычными словами — без знания законов и названий документов."],
  ["2", "Сравните варианты", "Готовый файл, автоматический сервис или помощь специалиста."],
  ["3", "Получите результат", "Документ сохраняется в кабинете. После подключения оплаты — одна покупка через общую корзину."],
];

export default function DocMarketHome() {
  const activeDirections = directions.filter(item => Number(item.materialsCount || 0) > 0).slice(0, 6);
  return <MarketFrame>
    <section className="market-hero market-glass dm-home-hero">
      <div className="dm-home-copy">
        <span className="market-kicker"><i className="fa-solid fa-cubes" /> ДокМаркет · документы и сервисы</span>
        <h1 className="market-title">Нужно решить вопрос с документами? Здесь понятно, что делать.</h1>
        <p className="market-subtitle">Расскажите, что произошло, или выберите готовое решение. Без сложных юридических слов и десятка непонятных экранов.</p>
        <div className="dm-hero-actions">
          <a className="market-primary" href="#start"><i className="fa-solid fa-route" />Подобрать решение</a>
          <Link className="market-action" to="/dosudebka"><i className="fa-solid fa-scale-balanced" />Создать претензию</Link>
          <Link className="market-action" to="/market"><i className="fa-solid fa-folder-open" />Каталог</Link>
        </div>
        <div className="market-trust-badges">
          <span className="market-trust-badge"><i className="fa-solid fa-language" />Понятным языком</span>
          <span className="market-trust-badge"><i className="fa-solid fa-file-word" />PDF и DOCX</span>
          <span className="market-trust-badge"><i className="fa-solid fa-folder-open" />Всё в одном кабинете</span>
          <span className="market-trust-badge"><i className="fa-solid fa-lock" />Приватные файлы</span>
        </div>
      </div>
      <aside className="dm-hero-result">
        <span>Пример</span>
        <p>«Мне не выплатили зарплату»</p>
        <i className="fa-solid fa-arrow-down" />
        <strong>Досудебка</strong>
        <small>ответы на вопросы → готовая претензия → PDF/DOCX</small>
        <Link to="/dosudebka">Попробовать <i className="fa-solid fa-arrow-right" /></Link>
      </aside>
    </section>

    <SimpleProblemChooser />

    <section className="dm-choice-section">
      <div className="dm-section-title"><span className="market-kicker"><i className="fa-solid fa-layer-group" />Три способа решить задачу</span><h2 className="market-heading">Выберите, сколько помощи вам нужно</h2><p className="market-lead">Один и тот же вопрос можно решить по-разному. Мы показываем разницу заранее.</p></div>
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
      <h2 className="market-heading">Три понятных шага</h2>
      <div className="dm-how-grid">{howItWorks.map(([number,title,text])=><article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
    </section>

    <section id="directions" className="dm-catalog-preview">
      <div className="dm-section-title"><span className="market-kicker"><i className="fa-solid fa-folder-tree" />Каталог</span><h2 className="market-heading">Уже доступные направления</h2><p className="market-lead">На главной показываем только то, где уже есть решения. Остальные направления появятся по мере наполнения.</p></div>
      {activeDirections.length ? <div className="market-grid">{activeDirections.map(item => <Link className="market-card market-glass" to={`/market/${item.slug}`} key={item.slug}><span className="market-icon"><i className={`fa-solid ${item.icon}`} /></span><h2>{item.title}</h2><p>{item.description}</p><div className="market-examples">{item.examples?.slice(0,3).map(example => <span className="market-example" key={example}>{example}</span>)}</div><span className="market-card-link">Посмотреть решения <i className="fa-solid fa-arrow-right" /></span></Link>)}</div> : <div className="market-empty market-glass">Каталог наполняется. Сейчас доступна Досудебка.</div>}
      <div className="dm-center-action"><Link className="market-action" to="/market">Открыть весь каталог <i className="fa-solid fa-arrow-right" /></Link></div>
    </section>

    <section className="dm-business-model market-panel market-glass">
      <div><span className="market-kicker"><i className="fa-solid fa-store" />Одна платформа</span><h2 className="market-heading">Купили один документ — следующий шаг уже рядом</h2><p className="market-lead">ДокМаркет строится как цепочка решений: документ → автоматический сервис → проверка → помощь специалиста. Пользователь не ищет новый сайт на каждом этапе.</p></div>
      <div className="dm-flow"><span>Документ</span><i className="fa-solid fa-arrow-right"/><span>Сервис</span><i className="fa-solid fa-arrow-right"/><span>Проверка</span><i className="fa-solid fa-arrow-right"/><span>Специалист</span></div>
    </section>
  </MarketFrame>;
}
