import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const situations = [
  { icon: "fa-rotate-left", title: "Вернуть деньги", text: "Товар, услуга, онлайн-курс или подписка" },
  { icon: "fa-money-bill-wave", title: "Получить зарплату", text: "Задержка выплаты, увольнение, расчёт" },
  { icon: "fa-hand-holding-dollar", title: "Вернуть долг", text: "Расписка, займ или договорённость" },
  { icon: "fa-file-circle-question", title: "Другая ситуация", text: "Опишите проблему — сервис подберёт структуру претензии" },
];

const output = [
  "Готовая досудебная претензия",
  "Подходящие требования и ссылки на нормы",
  "PDF и DOCX",
  "Инструкция по отправке",
];

const steps = [
  ["1", "Выберите ситуацию", "Укажите, что произошло и чего хотите добиться."],
  ["2", "Ответьте на вопросы", "Сервис соберёт необходимые данные для документа."],
  ["3", "Получите документ", "Проверьте данные, скачайте претензию и отправьте адресату."],
];

export default function Home() {
  return <div className="dm-dos-home">
    <div className="dm-dos-shell">
      <section className="dm-dos-hero">
        <div className="dm-dos-copy">
          <div className="dm-dos-badge"><i className="fa-solid fa-gavel" /> Сервис ДокМаркета</div>
          <h1>Досудебка</h1>
          <p className="dm-dos-lead">Создайте досудебную претензию по своей ситуации внутри ДокМаркета — без отдельной регистрации и отдельного кабинета.</p>
          <div className="dm-dos-actions">
            <Link className="dm-dos-primary" to={createPageUrl("Generator")}><i className="fa-solid fa-wand-magic-sparkles" /> Создать претензию</Link>
            <Link className="dm-dos-secondary" to={createPageUrl("Pricing")}><i className="fa-solid fa-tag" /> Стоимость</Link>
          </div>
          <div className="dm-dos-meta"><span><i className="fa-solid fa-file-word" /> PDF + DOCX</span><span><i className="fa-solid fa-shield-halved" /> Единый аккаунт ДокМаркета</span><span><i className="fa-solid fa-star" /> Отзывы внутри платформы</span></div>
        </div>
        <aside className="dm-dos-result">
          <span>Что получите</span>
          <h2>Готовый документ для отправки</h2>
          <div>{output.map(item => <p key={item}><i className="fa-solid fa-check" /> {item}</p>)}</div>
          <strong>от 490 ₽</strong>
          <small>Оплата подключается через общий процесс ДокМаркета. Отдельного аккаунта Досудебки нет.</small>
        </aside>
      </section>

      <section className="dm-dos-section">
        <div className="dm-dos-heading"><div><span>Ситуации</span><h2>С чем поможет сервис</h2></div><Link to={createPageUrl("Guide")}>Как это работает →</Link></div>
        <div className="dm-dos-grid">{situations.map(item => <Link key={item.title} className="dm-dos-card" to={createPageUrl("Generator")}><div><i className={`fa-solid ${item.icon}`} /></div><h3>{item.title}</h3><p>{item.text}</p><span>Начать →</span></Link>)}</div>
      </section>

      <section className="dm-dos-flow">
        <div className="dm-dos-heading"><div><span>Процесс</span><h2>Три шага до претензии</h2></div></div>
        <div className="dm-dos-steps">{steps.map(([number,title,text]) => <article key={number}><b>{number}</b><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
      </section>

      <section className="dm-dos-trust">
        <div><span>ДокМаркет</span><h2>Один сервис внутри одного приложения</h2><p>Покупки документов, Досудебка, специалисты, заказы и отзывы используют один аккаунт и один кабинет ДокМаркета.</p></div>
        <div className="dm-dos-trust-actions"><Link to="/reviews">Отзывы</Link><Link to="/market">Вернуться в каталог</Link></div>
      </section>
    </div>

    <style>{`
      .dm-dos-home{min-height:100vh;padding:24px 14px 84px;background:#07111d;color:#f8fafc}.dm-dos-shell{width:min(1180px,100%);margin:0 auto}.dm-dos-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:18px;margin-bottom:30px}.dm-dos-copy,.dm-dos-result,.dm-dos-card,.dm-dos-flow,.dm-dos-trust{border:1px solid #20384a;background:#0d1b29;border-radius:20px}.dm-dos-copy{padding:clamp(22px,4vw,42px);background:radial-gradient(circle at 85% 10%,rgba(255,159,28,.10),transparent 18rem),#0d1b29}.dm-dos-badge{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;color:#ffb65f;background:#21180d;border:1px solid #5f431f;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.dm-dos-copy h1{margin:16px 0 10px;font:850 clamp(2.4rem,7vw,4.7rem)/.98 'Space Grotesk',sans-serif}.dm-dos-lead{max-width:720px;margin:0;color:#a7b3c3;font-size:clamp(.95rem,2vw,1.18rem);line-height:1.55}.dm-dos-actions{display:flex;flex-wrap:wrap;gap:9px;margin:24px 0 16px}.dm-dos-actions a{min-height:46px;padding:0 16px;border-radius:12px;text-decoration:none;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:8px}.dm-dos-primary{background:linear-gradient(135deg,#f28a16,#ffb347);color:#07111d}.dm-dos-secondary{background:#101f2e;border:1px solid #294052;color:#eef3f8}.dm-dos-meta{display:flex;flex-wrap:wrap;gap:8px}.dm-dos-meta span{padding:7px 9px;border-radius:9px;background:#0a1723;border:1px solid #1c3345;color:#8fa0b2;font-size:.68rem}.dm-dos-meta i{color:#ff9f1c}.dm-dos-result{padding:22px;display:grid;align-content:start;gap:10px}.dm-dos-result>span,.dm-dos-heading>div>span,.dm-dos-trust>div>span{color:#ff9f1c;font-size:.66rem;font-weight:850;text-transform:uppercase;letter-spacing:.09em}.dm-dos-result h2{margin:0 0 5px;font-size:1.25rem}.dm-dos-result p{margin:0;padding:8px 0;border-bottom:1px solid #182d3e;color:#c7d0db;font-size:.78rem}.dm-dos-result p i{color:#65d98a;margin-right:7px}.dm-dos-result strong{margin-top:7px;font-size:1.45rem;color:#ffb65f}.dm-dos-result small{color:#718195;line-height:1.45}.dm-dos-section{margin-bottom:30px}.dm-dos-heading{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:12px}.dm-dos-heading h2{margin:4px 0 0;font-size:1.45rem}.dm-dos-heading a{color:#25c9e8;text-decoration:none;font-size:.75rem;font-weight:800}.dm-dos-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.dm-dos-card{padding:16px;color:#fff;text-decoration:none;min-height:185px;display:flex;flex-direction:column}.dm-dos-card>div{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#21180d;color:#ff9f1c;border:1px solid #5f431f}.dm-dos-card h3{margin:14px 0 6px;font-size:.96rem}.dm-dos-card p{margin:0;color:#8697aa;font-size:.74rem;line-height:1.45}.dm-dos-card>span{margin-top:auto;padding-top:12px;color:#ffb65f;font-size:.72rem;font-weight:800}.dm-dos-flow{padding:20px;margin-bottom:30px}.dm-dos-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.dm-dos-steps article{display:flex;gap:11px;padding:14px;border-radius:14px;background:#091723;border:1px solid #1d3344}.dm-dos-steps b{width:34px;height:34px;flex:0 0 34px;border-radius:10px;display:grid;place-items:center;background:#21180d;color:#ffb65f}.dm-dos-steps h3{margin:0 0 5px;font-size:.88rem}.dm-dos-steps p{margin:0;color:#8292a5;font-size:.7rem;line-height:1.45}.dm-dos-trust{padding:20px;display:flex;align-items:center;justify-content:space-between;gap:18px}.dm-dos-trust h2{margin:5px 0 7px;font-size:1.2rem}.dm-dos-trust p{margin:0;max-width:720px;color:#8494a7;font-size:.76rem;line-height:1.5}.dm-dos-trust-actions{display:flex;gap:8px;flex-wrap:wrap}.dm-dos-trust-actions a{padding:9px 11px;border-radius:10px;border:1px solid #294052;color:#e5edf5;text-decoration:none;font-size:.72rem;font-weight:800}
      @media(max-width:850px){.dm-dos-hero{grid-template-columns:1fr}.dm-dos-grid{grid-template-columns:repeat(2,1fr)}.dm-dos-steps{grid-template-columns:1fr}.dm-dos-trust{align-items:flex-start;flex-direction:column}}
      @media(max-width:520px){.dm-dos-home{padding:12px 10px 82px}.dm-dos-copy,.dm-dos-result{border-radius:16px}.dm-dos-copy{padding:18px}.dm-dos-copy h1{font-size:2.5rem}.dm-dos-actions{display:grid;grid-template-columns:1fr}.dm-dos-actions a{width:100%}.dm-dos-meta{display:grid}.dm-dos-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.dm-dos-card{min-height:150px;padding:12px;border-radius:14px}.dm-dos-card>div{width:36px;height:36px}.dm-dos-card h3{font-size:.82rem;margin-top:10px}.dm-dos-card p{font-size:.65rem}.dm-dos-heading h2{font-size:1.2rem}.dm-dos-heading a{font-size:.64rem}.dm-dos-flow,.dm-dos-trust{padding:14px;border-radius:16px}}
    `}</style>
  </div>;
}
