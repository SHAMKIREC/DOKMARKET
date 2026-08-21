import { Link } from "react-router-dom";

const benefits = [
  ["Документы", "Загружайте готовые документы и шаблоны в каталог."],
  ["Услуги", "Продавайте консультации, подготовку документов и другие профессиональные услуги."],
  ["Своя витрина", "Покупатель видит ваши товары, услуги, рейтинг и отзывы в одном профиле."],
  ["Заказы внутри ДокМаркета", "Покупки и заказы собираются в кабинете продавца."],
];

export default function ForLawyers() {
  return <main className="dm-seller-page">
    <section className="dm-seller-hero">
      <span className="dm-seller-kicker">СЕЛЛЕР ДОКМАРКЕТА</span>
      <h1>Продавайте документы и услуги</h1>
      <p>Один кабинет для специалистов разных направлений: юристов, бухгалтеров, кадровиков, консультантов, авторов шаблонов и других продавцов цифровых материалов.</p>
      <div className="dm-seller-actions">
        <Link className="dm-seller-primary" to="/RegisterLawyer">Стать селлером</Link>
        <Link className="dm-seller-secondary" to="/Login">Уже есть аккаунт</Link>
      </div>
    </section>

    <section className="dm-seller-grid">
      {benefits.map(([title,text]) => <article key={title}><span aria-hidden="true">✓</span><div><h2>{title}</h2><p>{text}</p></div></article>)}
    </section>

    <section className="dm-seller-note">
      <div><strong>Сейчас без отдельной подписки</strong><p>Регистрация продавца не связана с Досудебкой и её тарифами. Платные профессиональные инструменты, CRM и автоматизация могут появиться позже отдельными продуктами.</p></div>
      <Link to="/RegisterLawyer">Создать кабинет продавца →</Link>
    </section>

    <style>{`
      .dm-seller-page{min-height:100vh;padding:34px 16px 80px;background:radial-gradient(circle at 16% 0%,rgba(255,159,28,.10),transparent 28rem),#07111d;color:#f8fafc}.dm-seller-hero,.dm-seller-grid,.dm-seller-note{width:min(980px,100%);margin-left:auto;margin-right:auto}.dm-seller-hero{padding:clamp(22px,5vw,42px);border-radius:24px;border:1px solid #263d4f;background:linear-gradient(145deg,#0e1c2a,#0a1723);box-shadow:0 20px 55px rgba(0,0,0,.22)}.dm-seller-kicker{color:#ffad42;font-size:.72rem;font-weight:900;letter-spacing:.12em}.dm-seller-hero h1{margin:12px 0 10px;font:850 clamp(2rem,7vw,3.6rem)/1.02 'Space Grotesk',sans-serif;letter-spacing:-.04em}.dm-seller-hero p{max-width:760px;margin:0;color:#9aabbd;font-size:clamp(.9rem,2vw,1.05rem);line-height:1.65}.dm-seller-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.dm-seller-actions a,.dm-seller-note>a{min-height:46px;padding:12px 17px;border-radius:12px;text-decoration:none;font-weight:850;display:inline-flex;align-items:center;justify-content:center}.dm-seller-primary{background:linear-gradient(135deg,#f28a16,#ffb347);color:#07111d}.dm-seller-secondary{border:1px solid #30485a;color:#e6edf5;background:#0b1825}.dm-seller-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}.dm-seller-grid article{display:flex;gap:12px;padding:18px;border-radius:17px;border:1px solid #20384a;background:#0d1b29}.dm-seller-grid article>span{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#07111d;background:#ff9f1c;font-weight:900;flex:0 0 34px}.dm-seller-grid h2{margin:0 0 5px;font-size:1rem}.dm-seller-grid p{margin:0;color:#8fa0b3;font-size:.8rem;line-height:1.5}.dm-seller-note{margin-top:18px;padding:18px;border-radius:17px;border:1px solid #4d3b22;background:#17130d;display:flex;align-items:center;justify-content:space-between;gap:18px}.dm-seller-note strong{font-size:.95rem}.dm-seller-note p{margin:5px 0 0;color:#9d9385;font-size:.78rem;line-height:1.5}.dm-seller-note>a{white-space:nowrap;background:#ff9f1c;color:#07111d}@media(max-width:640px){.dm-seller-page{padding:18px 12px 70px}.dm-seller-grid{grid-template-columns:1fr}.dm-seller-note{align-items:stretch;flex-direction:column}.dm-seller-note>a{width:100%}.dm-seller-actions{display:grid;grid-template-columns:1fr}.dm-seller-actions a{width:100%}}
    `}</style>
  </main>;
}
