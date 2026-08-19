import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const steps = [
  { title: "Заполните данные", desc: "Укажите заявителя, ответчика, суммы, даты и обстоятельства. Сервис соберёт из этого основу претензии." },
  { title: "Проверьте образец", desc: "Перед оплатой откройте предпросмотр с водяным знаком и проверьте главное: ФИО, адреса, суммы, даты и требования." },
  { title: "Скачайте документ", desc: "После оплаты будут доступны PDF для отправки и DOCX для редактирования." },
  { title: "Подпишите претензию", desc: "Если отправляете на бумаге, распечатайте претензию и подпишите её. Для онлайн-отправки используйте PDF." },
  { title: "Приложите доказательства", desc: "Приложите только материалы, которые подтверждают вашу ситуацию: чеки, переписку, фото, выписки и документы." },
  { title: "Отправьте адресату", desc: "Самый надёжный способ для бумажной отправки — заказное письмо с описью вложения по юридическому адресу." },
  { title: "Сохраните подтверждение", desc: "Сохраните чек, трек-номер, опись вложения, уведомление о вручении или номер электронного обращения." },
];

const deliveryMethods = [
  { icon: "fa-envelope", title: "Почтой России", desc: "Отправьте претензию заказным письмом с описью вложения по юридическому адресу ответчика. Это один из самых надёжных способов подтвердить отправку.", tip: "Сохраните чек, трек-номер и опись вложения." },
  { icon: "fa-laptop", title: "Онлайн", desc: "Подходит, если у магазина, банка, маркетплейса или сервиса есть личный кабинет, форма обращения или официальный email.", tip: "Сохраните номер обращения, email-квитанцию или подтверждение отправки. Если площадка ограничивает размер файла, используйте PDF до 5 МБ." },
  { icon: "fa-building", title: "Лично", desc: "Распечатайте два экземпляра: один отдаёте адресату, второй оставляете себе.", tip: "На вашем экземпляре должны поставить дату, подпись, ФИО или должность принявшего и отметку о принятии." },
];

const evidenceItems = [
  { icon: "fa-receipt", title: "Чек или банковская выписка", text: "Подтверждает оплату, перевод или размер расходов." },
  { icon: "fa-file-contract", title: "Договор, оферта или заказ", text: "Показывает условия, цену, сроки и обязанности сторон." },
  { icon: "fa-comments", title: "Переписка", text: "Сообщения, email, обращения в поддержку, ответы продавца или работодателя." },
  { icon: "fa-camera", title: "Фото и скриншоты", text: "Подтверждают недостатки товара, отказ, переписку, личный кабинет или статус обращения." },
  { icon: "fa-reply", title: "Ответ адресата", text: "Отказ, обещание решить вопрос, номер обращения или официальный ответ." },
  { icon: "fa-folder-open", title: "Акты и документы", text: "Экспертиза, диагностика, табель, расчётные листки, акты, справки." },
];

const deadlines = [
  { icon: "fa-cart-shopping", title: "Покупки и услуги", text: "По требованиям о возврате денег часто ориентируются на 10 дней." },
  { icon: "fa-briefcase", title: "Трудовые споры", text: "По зарплате и расчёту лучше не ждать долго. В претензии можно указать: незамедлительно, но не позднее 10 календарных дней со дня получения." },
  { icon: "fa-handshake", title: "Долги и договоры", text: "Обычно указывают разумный срок, например 10–30 дней, если другой срок не следует из договора или закона." },
];

const commonErrors = [
  { title: "Не указали точный адрес ответчика", text: "Проверяйте юридический адрес, ИНН и ОГРН/ОГРНИП." },
  { title: "Не приложили доказательства", text: "Без чеков, переписки, фото или выписок требования сложнее подтвердить." },
  { title: "Не сохранили подтверждение отправки", text: "Нужны чек, трек-номер, опись, отметка о принятии или номер электронного обращения." },
  { title: "Ошиблись в сумме или датах", text: "Проверьте дату покупки, дату работы, срок просрочки и сумму требований." },
  { title: "Отправили без подписи", text: "Для бумажной претензии подпись обязательна." },
  { title: "Написали слишком эмоционально", text: "Лучше писать факты, суммы, даты и конкретные требования." },
];

const sectionTitleStyle = { fontFamily: "'Space Grotesk',sans-serif", color: "white", fontWeight: 800, fontSize: "clamp(1.45rem,3vw,2rem)", letterSpacing: "-.015em", margin: 0 };

export default function Guide() {
  return (
    <div className="guide-page">
      <style>{`
        .guide-page { min-height:100vh; padding:96px 0 72px; background:radial-gradient(circle at 10% 7%,rgba(14,165,233,.1),transparent 27%),radial-gradient(circle at 90% 12%,rgba(139,92,246,.11),transparent 31%),linear-gradient(180deg,rgba(2,6,23,.2),rgba(2,6,23,.78)); }
        .guide-wrap { width:min(1180px,calc(100% - 40px)); margin:0 auto; }
        .guide-hero { display:grid; grid-template-columns:minmax(0,1.08fr) minmax(390px,.92fr); gap:30px; align-items:center; margin-bottom:50px; }
        .guide-hero-side { align-self:center; animation:guideReveal .5s ease .08s both; }
        .guide-glass { background:linear-gradient(145deg,rgba(15,23,42,.78),rgba(15,23,42,.52)); border:1px solid rgba(148,163,184,.15); box-shadow:0 22px 54px rgba(2,8,23,.3),inset 0 1px rgba(255,255,255,.025); backdrop-filter:blur(12px); }
        .guide-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:11px 18px; border-radius:11px; text-decoration:none; font-size:.9rem; font-weight:750; transition:all .2s ease; }
        .guide-button:hover { transform:translateY(-1px); }
        .guide-button:active { transform:scale(.99); }
        .guide-primary:hover { box-shadow:0 14px 32px rgba(59,130,246,.26); }
        .guide-secondary:hover { border-color:rgba(167,139,250,.48)!important; box-shadow:0 12px 28px rgba(139,92,246,.1); }
        .guide-path-item { display:grid; grid-template-columns:36px 1fr; gap:12px; align-items:center; position:relative; }
        .guide-path-item:not(:last-child)::after { content:""; position:absolute; left:17px; top:35px; width:1px; height:17px; background:linear-gradient(rgba(34,211,238,.5),rgba(139,92,246,.35)); }
        .guide-section { margin-top:58px; animation:guideReveal .48s ease both; }
        .guide-section:nth-of-type(3) { animation-delay:.05s; }
        .guide-section:nth-of-type(4) { animation-delay:.1s; }
        .guide-section:nth-of-type(5) { animation-delay:.15s; }
        .guide-section:nth-of-type(6) { animation-delay:.2s; }
        .guide-section-head { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:22px; }
        .guide-steps { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); grid-auto-rows:1fr; gap:14px; align-items:stretch; }
        .guide-step { height:100%; display:grid; grid-template-columns:48px 1fr; gap:16px; align-content:start; padding:20px; border-radius:17px; transition:all .2s ease; animation:guideReveal .42s ease both; }
        .guide-step:nth-child(2n) { animation-delay:.06s; }
        .guide-step:hover,.guide-card:hover,.guide-evidence:hover,.guide-error:hover { transform:translateY(-2px); border-color:rgba(103,232,249,.34)!important; box-shadow:0 18px 40px rgba(2,8,23,.3),0 0 26px rgba(14,165,233,.07); }
        .guide-step:last-child { grid-column:1/-1; }
        .guide-number { width:48px; height:48px; border-radius:14px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#cffafe; background:linear-gradient(145deg,rgba(6,182,212,.2),rgba(124,58,237,.18)); border:1px solid rgba(103,232,249,.24); font-weight:850; }
        .guide-number small { font-size:.58rem; color:#94a3b8; font-weight:650; line-height:1; margin-top:2px; }
        .guide-three-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:15px; }
        .guide-card { padding:21px; border-radius:17px; display:flex; flex-direction:column; transition:all .2s ease; }
        .guide-icon { width:42px; height:42px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; color:#67e8f9; background:linear-gradient(135deg,rgba(14,165,233,.14),rgba(139,92,246,.15)); border:1px solid rgba(103,232,249,.17); margin-bottom:13px; }
        .guide-evidence-grid,.guide-error-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
        .guide-evidence,.guide-error { min-height:112px; padding:17px; border-radius:14px; display:flex; align-items:flex-start; gap:12px; transition:all .2s ease; }
        .guide-deadlines { padding:24px; border-radius:20px; background:radial-gradient(circle at 90% 0%,rgba(139,92,246,.13),transparent 38%),linear-gradient(145deg,rgba(8,47,73,.26),rgba(15,23,42,.76) 46%); border:1px solid rgba(103,232,249,.21); box-shadow:0 20px 48px rgba(2,8,23,.3); }
        .guide-cta { margin-top:64px; padding:clamp(24px,5vw,38px); border-radius:23px; text-align:center; background:radial-gradient(circle at 20% 0%,rgba(14,165,233,.15),transparent 34%),radial-gradient(circle at 85% 100%,rgba(139,92,246,.16),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.86),rgba(15,23,42,.66)); border:1px solid rgba(103,232,249,.24); box-shadow:0 26px 64px rgba(2,8,23,.38),0 0 36px rgba(99,102,241,.055); animation:guideReveal .5s ease .15s both; }
        .guide-help { margin:22px auto 0; max-width:620px; padding:14px 16px; border-radius:14px; display:flex; align-items:center; justify-content:space-between; gap:15px; text-align:left; background:rgba(2,6,23,.28); border:1px solid rgba(148,163,184,.13); }
        .guide-telegram { display:inline-flex; align-items:center; justify-content:center; gap:7px; flex-shrink:0; padding:8px 12px; border-radius:9px; color:#bae6fd; background:rgba(14,165,233,.07); border:1px solid rgba(103,232,249,.2); text-decoration:none; font-size:.82rem; font-weight:700; transition:all .2s ease; }
        .guide-telegram:hover { transform:translateY(-1px); border-color:rgba(103,232,249,.42); box-shadow:0 10px 24px rgba(14,165,233,.1); }
        @keyframes guideReveal { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width:820px) {
          .guide-hero { grid-template-columns:1fr; margin-bottom:52px; }
          .guide-three-grid { grid-template-columns:1fr; }
          .guide-evidence-grid,.guide-error-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
        @media (max-width:640px) {
          .guide-page { padding-top:84px; }
          .guide-wrap { width:min(100% - 28px,1180px); }
          .guide-steps,.guide-evidence-grid,.guide-error-grid { grid-template-columns:1fr; }
          .guide-step:last-child { grid-column:auto; }
          .guide-step { grid-template-columns:42px 1fr; padding:17px; gap:12px; }
          .guide-number { width:42px; height:42px; }
          .guide-section { margin-top:50px; }
          .guide-section-head { align-items:flex-start; flex-direction:column; gap:8px; }
          .guide-hero-actions { flex-direction:column; }
          .guide-button { width:100%; }
          .guide-help { align-items:stretch; flex-direction:column; }
          .guide-telegram { width:100%; }
        }
        @media (prefers-reduced-motion:reduce) {
          .guide-section,.guide-step,.guide-hero-side,.guide-cta { animation:none; }
          .guide-step,.guide-card,.guide-evidence,.guide-error,.guide-button,.guide-telegram { transition:none; }
        }
      `}</style>

      <main className="guide-wrap">
        <section className="guide-hero">
          <div style={{ padding: "clamp(8px,2vw,24px) 0", alignSelf: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#a5f3fc", background: "rgba(14,165,233,.07)", border: "1px solid rgba(103,232,249,.18)", borderRadius: 999, padding: "6px 10px", fontSize: ".72rem", fontWeight: 750, marginBottom: 16 }}><i className="fa-solid fa-route"></i>Инструкция от заполнения до отправки</span>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "white", fontSize: "clamp(2.15rem,5vw,3.7rem)", lineHeight: 1.08, letterSpacing: "-.035em", fontWeight: 850, margin: "0 0 17px" }}>Как отправить претензию правильно</h1>
            <p style={{ color: "#a5b4c7", fontSize: "clamp(.95rem,2vw,1.08rem)", lineHeight: 1.7, maxWidth: 690, margin: "0 0 25px" }}>Досудебка помогает составить документ, но важно ещё правильно его проверить, подписать и направить адресату.</p>
            <div className="guide-hero-actions" style={{ display: "flex", gap: 11, flexWrap: "wrap" }}>
              <Link className="guide-button guide-primary" to={createPageUrl("Generator")} style={{ color: "white", background: "linear-gradient(120deg,#06b6d4,#3b82f6 52%,#8b5cf6)", boxShadow: "0 12px 28px rgba(59,130,246,.18)" }}><i className="fa-solid fa-plus"></i>Создать претензию</Link>
              <Link className="guide-button guide-secondary" to={createPageUrl("Pricing")} style={{ color: "#e2e8f0", background: "rgba(255,255,255,.035)", border: "1px solid rgba(167,139,250,.24)" }}><i className="fa-solid fa-tags"></i>Посмотреть тарифы</Link>
            </div>
          </div>

          <div className="guide-hero-side">
            <aside className="guide-glass" style={{ borderRadius: 21, padding: "22px", background: "radial-gradient(circle at 100% 0%,rgba(139,92,246,.16),transparent 42%),linear-gradient(145deg,rgba(15,23,42,.84),rgba(8,47,73,.28))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
                <span className="guide-icon" style={{ width: 46, height: 46, marginBottom: 0 }}><i className="fa-solid fa-location-arrow"></i></span>
                <div><p style={{ color: "white", fontWeight: 800, margin: "0 0 3px", fontSize: "1.06rem" }}>Ваш путь до отправки</p><p style={{ color: "rgba(220,235,255,.72)", fontSize: ".82rem", margin: 0 }}>4 понятных этапа</p></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {["Заполнить данные", "Проверить образец", "Скачать PDF/DOCX", "Отправить адресату"].map((item, index) => (
                  <div className="guide-path-item" key={item}>
                    <span style={{ width: 36, height: 36, borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,rgba(6,182,212,.2),rgba(124,58,237,.2))", border: "1px solid rgba(103,232,249,.22)", color: "#cffafe", fontSize: ".78rem", fontWeight: 850, zIndex: 1 }}>{index + 1}</span>
                    <span style={{ color: "rgba(235,245,255,.9)", fontSize: ".91rem", fontWeight: 680 }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 18, paddingTop: 15, borderTop: "1px solid rgba(148,163,184,.12)" }}>
                {["PDF с приложениями", "DOCX для правок", "Без водяного знака после оплаты"].map(label => <span key={label} style={{ color: "rgba(220,235,255,.82)", background: "rgba(255,255,255,.035)", border: "1px solid rgba(103,232,249,.14)", borderRadius: 999, padding: "5px 8px", fontSize: ".69rem", fontWeight: 650 }}><i className="fa-solid fa-check" style={{ color: "#22d3ee", marginRight: 5 }}></i>{label}</span>)}
              </div>
            </aside>
            <p style={{ color: "rgba(220,235,255,.8)", fontSize: ".84rem", lineHeight: 1.5, margin: "10px 5px 0" }}>Пройдите шаги последовательно — так меньше риск забыть подпись, приложения или подтверждение отправки.</p>
          </div>
        </section>

        <section className="guide-section" style={{ marginTop: 0 }}>
          <div className="guide-section-head"><div><p style={{ color: "#22d3ee", fontSize: ".78rem", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", margin: "0 0 6px" }}>По порядку</p><h2 style={sectionTitleStyle}>7 шагов до отправки</h2></div><p style={{ color: "rgba(220,235,255,.72)", fontSize: ".88rem", lineHeight: 1.5, maxWidth: 430, margin: 0 }}>На каждом этапе проверяйте данные и сохраняйте подтверждающие документы.</p></div>
          <div className="guide-steps">
            {steps.map((step, index) => (
              <article className="guide-step guide-glass" key={step.title}>
                <div className="guide-number"><span>{index + 1}</span><small>ШАГ</small></div>
                <div><h3 style={{ color: "white", fontSize: "1.02rem", lineHeight: 1.35, fontWeight: 760, margin: "2px 0 10px" }}>{step.title}</h3><p style={{ color: "rgba(220,235,255,.86)", fontSize: ".92rem", lineHeight: 1.56, margin: 0 }}>{step.desc}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="guide-section">
          <div className="guide-section-head"><h2 style={sectionTitleStyle}>Как отправить претензию</h2><p style={{ color: "rgba(220,235,255,.76)", fontSize: ".88rem", lineHeight: 1.5, maxWidth: 450, margin: 0 }}>Главное — потом доказать, когда и что именно вы отправили.</p></div>
          <div className="guide-three-grid">
            {deliveryMethods.map(method => <article className="guide-card guide-glass" key={method.title}><span className="guide-icon"><i className={`fa-solid ${method.icon}`}></i></span><h3 style={{ color: "white", fontSize: "1.02rem", fontWeight: 760, margin: "0 0 8px" }}>{method.title}</h3><p style={{ color: "rgba(220,235,255,.83)", fontSize: ".89rem", lineHeight: 1.55, margin: "0 0 15px" }}>{method.desc}</p><div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(148,163,184,.11)" }}><p style={{ color: "#a5f3fc", fontSize: ".82rem", fontWeight: 750, margin: "0 0 4px" }}><i className="fa-solid fa-bookmark" style={{ marginRight: 7 }}></i>Что сохранить:</p><p style={{ color: "rgba(205,225,245,.76)", fontSize: ".82rem", lineHeight: 1.5, margin: 0 }}>{method.tip}</p></div></article>)}
          </div>
        </section>

        <section className="guide-section">
          <div className="guide-section-head"><div><h2 style={sectionTitleStyle}>Какие доказательства приложить</h2><p style={{ color: "rgba(220,235,255,.76)", fontSize: ".88rem", lineHeight: 1.5, margin: "8px 0 0" }}>Прикладывайте не всё подряд, а только то, что подтверждает ваши требования.</p></div></div>
          <div className="guide-evidence-grid">
            {evidenceItems.map(item => <article className="guide-evidence guide-glass" key={item.title}><span style={{ width: 39, height: 39, borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#a5f3fc", background: "rgba(14,165,233,.09)", border: "1px solid rgba(103,232,249,.15)" }}><i className={`fa-solid ${item.icon}`}></i></span><div><h3 style={{ color: "#eff6ff", fontSize: ".92rem", lineHeight: 1.4, fontWeight: 720, margin: "0 0 5px" }}>{item.title}</h3><p style={{ color: "rgba(205,225,245,.75)", fontSize: ".82rem", lineHeight: 1.5, margin: 0 }}>{item.text}</p></div></article>)}
          </div>
          <p style={{ color: "rgba(220,235,255,.78)", fontSize: ".84rem", lineHeight: 1.5, margin: "15px 2px 0", padding: "11px 13px", borderRadius: 11, background: "rgba(14,165,233,.045)", border: "1px solid rgba(103,232,249,.12)" }}><i className="fa-solid fa-file-image" style={{ color: "#22d3ee", marginRight: 7 }}></i>Для онлайн-отправки лучше использовать JPG/PNG и следить, чтобы итоговый PDF не превышал лимит площадки.</p>
        </section>

        <section className="guide-section guide-deadlines">
          <div className="guide-section-head"><div><h2 style={sectionTitleStyle}>Сроки ответа зависят от ситуации</h2><p style={{ color: "rgba(220,235,255,.78)", fontSize: ".88rem", lineHeight: 1.5, margin: "7px 0 0" }}>В претензии обычно указывают срок для добровольного ответа или исполнения требований.</p></div></div>
          <div className="guide-three-grid">
            {deadlines.map(item => <article className="guide-card" key={item.title} style={{ background: "rgba(255,255,255,.028)", border: "1px solid rgba(148,163,184,.13)" }}><span className="guide-icon"><i className={`fa-solid ${item.icon}`}></i></span><h3 style={{ color: "white", fontSize: ".98rem", fontWeight: 750, margin: "0 0 8px" }}>{item.title}</h3><p style={{ color: "rgba(220,235,255,.82)", fontSize: ".87rem", lineHeight: 1.55, margin: 0 }}>{item.text}</p></article>)}
          </div>
          <p style={{ color: "rgba(220,235,255,.8)", fontSize: ".84rem", lineHeight: 1.52, margin: "17px 0 0", padding: "11px 13px", borderRadius: 11, background: "linear-gradient(135deg,rgba(14,165,233,.055),rgba(139,92,246,.055))", border: "1px solid rgba(167,139,250,.15)" }}><i className="fa-regular fa-clock" style={{ color: "#c4b5fd", marginRight: 7 }}></i>Точный срок зависит от категории спора, требований и документов. Если сомневаетесь, проверьте срок перед отправкой.</p>
        </section>

        <section className="guide-section">
          <div className="guide-section-head"><div><h2 style={sectionTitleStyle}>Частые ошибки при отправке</h2><p style={{ color: "rgba(220,235,255,.76)", fontSize: ".88rem", lineHeight: 1.5, margin: "8px 0 0" }}>Эти мелочи часто мешают доказать, что претензия действительно была направлена.</p></div></div>
          <div className="guide-error-grid">
            {commonErrors.map(error => <article className="guide-error guide-glass" key={error.title}><span style={{ width: 36, height: 36, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fda4af", background: "rgba(244,63,94,.07)", border: "1px solid rgba(251,113,133,.13)" }}><i className="fa-solid fa-xmark"></i></span><div><h3 style={{ color: "#fff1f2", fontSize: ".91rem", lineHeight: 1.4, fontWeight: 720, margin: "0 0 5px" }}>{error.title}</h3><p style={{ color: "rgba(220,225,240,.76)", fontSize: ".82rem", lineHeight: 1.5, margin: 0 }}>{error.text}</p></div></article>)}
          </div>
          <p style={{ color: "rgba(220,235,255,.82)", fontSize: ".88rem", lineHeight: 1.55, margin: "17px 2px 0" }}><i className="fa-solid fa-check-double" style={{ color: "#22d3ee", marginRight: 7 }}></i>Перед отправкой проверьте: ФИО, адреса, реквизиты, суммы, даты, требования, приложения и подпись.</p>
        </section>

        <section className="guide-cta">
          <span className="guide-icon" style={{ marginBottom: 15 }}><i className="fa-solid fa-file-circle-check"></i></span>
          <h2 style={{ ...sectionTitleStyle, fontSize: "clamp(1.6rem,4vw,2.3rem)" }}>Готовы составить претензию?</h2>
          <p style={{ color: "rgba(220,235,255,.78)", fontSize: ".92rem", lineHeight: 1.58, margin: "9px auto 21px", maxWidth: 560 }}>Выберите ситуацию, заполните данные и получите документ для отправки.</p>
          <div className="guide-hero-actions" style={{ display: "flex", justifyContent: "center", gap: 11, flexWrap: "wrap" }}>
            <Link className="guide-button guide-primary" to={createPageUrl("Generator")} style={{ color: "white", background: "linear-gradient(120deg,#06b6d4,#3b82f6 52%,#8b5cf6)" }}><i className="fa-solid fa-plus"></i>Создать претензию</Link>
            <Link className="guide-button guide-secondary" to={createPageUrl("Pricing")} style={{ color: "#e2e8f0", background: "rgba(255,255,255,.035)", border: "1px solid rgba(167,139,250,.24)" }}><i className="fa-solid fa-tags"></i>Посмотреть тарифы</Link>
          </div>
          <div className="guide-help">
            <div><p style={{ color: "white", fontSize: ".9rem", fontWeight: 740, margin: "0 0 3px" }}>Не нашли свою ситуацию?</p><p style={{ color: "rgba(220,235,255,.72)", fontSize: ".82rem", lineHeight: 1.45, margin: 0 }}>Напишите нам в Telegram — подскажем, какой формат выбрать.</p></div>
            <a className="guide-telegram" href="https://t.me/+mxSPQZosRBAwMTMy" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-telegram"></i>Написать в Telegram</a>
          </div>
        </section>
      </main>
    </div>
  );
}
