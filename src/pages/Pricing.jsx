import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const plans = [
  {
    id: "single",
    label: "Для одного человека",
    icon: "fa-file-lines",
    name: "Личная претензия",
    desc: "Ответьте на вопросы — сервис соберёт претензию под вашу ситуацию.",
    price: "490 ₽",
    features: [
      "Готовый документ по вашим ответам",
      "PDF и DOCX",
      "Предпросмотр до сохранения",
      "Можно исправить введённые данные",
    ],
    buttonText: "Создать претензию",
  },
  {
    id: "collective",
    label: "Для группы",
    icon: "fa-users",
    name: "Коллективная претензия",
    desc: "Создайте группу, соберите данные участников по ссылке и получите один общий документ.",
    price: "790 ₽ / участник",
    features: [
      "Ссылка для участников",
      "Каждый заполняет свои данные",
      "Один общий документ",
      "PDF и DOCX",
    ],
    buttonText: "Создать групповую претензию",
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <main className="dm-pricing-page">
      <style>{`
        .dm-pricing-page{min-height:100vh;padding:82px 14px 72px;color:#f8fafc;background:radial-gradient(circle at 15% 0%,rgba(8,145,178,.12),transparent 28rem),radial-gradient(circle at 85% 5%,rgba(124,58,237,.14),transparent 30rem),#07111d}
        .dm-pricing-wrap{width:min(920px,100%);margin:0 auto}
        .dm-pricing-head{margin:0 auto 22px;text-align:center;max-width:680px}
        .dm-pricing-head>span{display:inline-flex;padding:6px 10px;border-radius:999px;background:rgba(34,211,238,.08);border:1px solid rgba(103,232,249,.18);color:#67e8f9;font-size:.72rem;font-weight:800}
        .dm-pricing-head h1{margin:12px 0 8px;font:800 clamp(1.8rem,7vw,2.65rem)/1.08 "Space Grotesk",sans-serif;letter-spacing:-.035em}
        .dm-pricing-head p{margin:0;color:#94a3b8;line-height:1.55;font-size:.92rem}
        .dm-pricing-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .dm-plan{display:flex;flex-direction:column;padding:22px;border-radius:20px;background:linear-gradient(145deg,rgba(20,28,49,.84),rgba(13,12,29,.9));border:1px solid rgba(103,232,249,.15);box-shadow:0 18px 48px rgba(0,0,0,.22)}
        .dm-plan-icon{width:46px;height:46px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(135deg,rgba(8,145,178,.16),rgba(124,58,237,.17));border:1px solid rgba(103,232,249,.18);color:#a5f3fc;margin-bottom:14px}
        .dm-plan-label{color:#67e8f9;font-size:.69rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
        .dm-plan h2{margin:7px 0 7px;font-size:1.25rem}
        .dm-plan-desc{margin:0;color:#9aa8bb;font-size:.82rem;line-height:1.52}
        .dm-plan-price{display:block;margin:17px 0 13px;font-size:1.75rem;line-height:1;font-weight:900;color:#fff}
        .dm-plan ul{display:grid;gap:9px;padding:0;margin:0 0 20px;list-style:none;color:#cbd5e1;font-size:.8rem;line-height:1.4}
        .dm-plan li{display:flex;gap:8px;align-items:flex-start}.dm-plan li:before{content:"✓";color:#67e8f9;font-weight:900}
        .dm-plan button{margin-top:auto;min-height:46px;border:0;border-radius:12px;padding:11px 14px;background:linear-gradient(135deg,#0891b2,#7c3aed);color:#fff;font:800 .84rem/1.2 inherit;cursor:pointer}
        .dm-pricing-note{display:flex;align-items:flex-start;gap:12px;margin-top:14px;padding:16px;border-radius:16px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08)}
        .dm-pricing-note i{color:#67e8f9;margin-top:3px}.dm-pricing-note strong{font-size:.86rem}.dm-pricing-note p{margin:4px 0 0;color:#8897aa;font-size:.76rem;line-height:1.5}
        @media(max-width:640px){.dm-pricing-page{padding:68px 12px 64px}.dm-pricing-head{text-align:left}.dm-pricing-grid{grid-template-columns:1fr}.dm-plan{padding:18px;border-radius:17px}.dm-plan-price{font-size:1.55rem}.dm-plan ul{margin-bottom:16px}.dm-pricing-note{padding:14px}}
      `}</style>

      <section className="dm-pricing-wrap">
        <div className="dm-pricing-head">
          <span>Досудебка · сервис ДокМаркета</span>
          <h1>Выберите формат претензии</h1>
          <p>Заполните данные, посмотрите итоговый документ и сохраните его в PDF или DOCX. Отдельного тарифа CHECK больше нет.</p>
        </div>

        <div className="dm-pricing-grid">
          {plans.map(plan => (
            <article className="dm-plan" key={plan.id}>
              <span className="dm-plan-icon"><i className={`fa-solid ${plan.icon}`} /></span>
              <span className="dm-plan-label">{plan.label}</span>
              <h2>{plan.name}</h2>
              <p className="dm-plan-desc">{plan.desc}</p>
              <strong className="dm-plan-price">{plan.price}</strong>
              <ul>{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
              <button type="button" onClick={() => navigate(createPageUrl("Generator"))}>{plan.buttonText}</button>
            </article>
          ))}
        </div>

        <div className="dm-pricing-note">
          <i className="fa-solid fa-shield-halved" />
          <div><strong>Перед сохранением всё видно</strong><p>Пользователь проверяет введённые данные и итоговый текст до скачивания документа.</p></div>
        </div>
      </section>
    </main>
  );
}
