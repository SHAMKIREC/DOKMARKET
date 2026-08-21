import { Link } from "react-router-dom";

const nrvContacts = [
  ["Telegram", "https://t.me/+79330306949"],
  ["WhatsApp", "https://wa.me/79372296949"],
  ["MAX", "https://max.ru/u/f9LHodD0cOJGhA6Iqydw0l5vyUcc1UB4Nga5i6hchfiD9IkzOYkbDUiR9jg"],
  ["VK", "https://vk.ru/zeleny_kontrakt"],
];

export default function Partners(){
  return <main className="dm-partners-page">
    <section className="dm-partners-hero">
      <span>ПАРТНЁРЫ ДОКМАРКЕТА</span>
      <h1>Сервисы и команды внутри экосистемы</h1>
      <p>ДокМаркет объединяет собственные сервисы и партнёрские направления, которые помогают создавать, автоматизировать и применять документы в реальной работе.</p>
    </section>

    <section className="dm-partner-grid">
      <article className="dm-partner-card rb">
        <div className="dm-partner-mark">РБ</div>
        <div><span className="dm-partner-type">СТРОИТЕЛЬНЫЙ ПАРТНЁР</span><h2>Решаем Быстро</h2><p>Строительные и ремонтные работы, а также практическая база для направления строительной документации.</p><div className="dm-partner-actions"><a href="https://www.rb-24.ru/" target="_blank" rel="noreferrer">Открыть сайт</a><Link to="/construction-docs">Строительная документация</Link></div></div>
      </article>

      <article className="dm-partner-card nrv">
        <div className="dm-partner-mark">NRV</div>
        <div><span className="dm-partner-type">ТЕХНОЛОГИЧЕСКИЙ ПАРТНЁР</span><h2>NRV DIGITAL</h2><p>Разработка сайтов, каталогов, калькуляторов, веб-приложений и автоматизация цифровых процессов.</p><div className="dm-contact-row">{nrvContacts.map(([label,href])=><a key={label} href={href} target="_blank" rel="noreferrer">{label}</a>)}</div></div>
      </article>
    </section>

    <style>{`
      .dm-partners-page{min-height:100vh;padding:34px 16px 82px;background:radial-gradient(circle at 10% 0%,rgba(255,159,28,.09),transparent 28rem),radial-gradient(circle at 90% 15%,rgba(37,201,232,.06),transparent 25rem),#07111d;color:#f8fafc}.dm-partners-hero,.dm-partner-grid{width:min(1040px,100%);margin:auto}.dm-partners-hero{padding:clamp(22px,5vw,40px);border-radius:24px;border:1px solid #263d4f;background:#0d1b29}.dm-partners-hero>span,.dm-partner-type{color:#ffad42;font-size:.69rem;font-weight:900;letter-spacing:.11em}.dm-partners-hero h1{margin:11px 0 10px;font:850 clamp(2rem,7vw,3.5rem)/1.04 'Space Grotesk',sans-serif;letter-spacing:-.04em}.dm-partners-hero p{max-width:780px;margin:0;color:#95a5b8;line-height:1.6}.dm-partner-grid{display:grid;gap:14px;margin-top:16px}.dm-partner-card{display:grid;grid-template-columns:90px 1fr;gap:18px;padding:20px;border-radius:20px;border:1px solid #243c4f;background:#0c1926}.dm-partner-card.rb{border-color:#5a3d1d}.dm-partner-card.nrv{border-color:#314454}.dm-partner-mark{width:82px;height:82px;border-radius:19px;display:grid;place-items:center;font-weight:950;background:#172536;border:1px solid #32485b;color:#fff}.dm-partner-card.rb .dm-partner-mark{background:#20170c;border-color:#65451d;color:#ffad42}.dm-partner-card.nrv .dm-partner-mark{color:#ff9f1c}.dm-partner-card h2{margin:5px 0 6px;font-size:1.35rem}.dm-partner-card p{margin:0;color:#8f9fb2;line-height:1.55;font-size:.84rem}.dm-partner-actions,.dm-contact-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.dm-partner-actions a,.dm-contact-row a{padding:9px 11px;border-radius:10px;border:1px solid #31485b;color:#dfe7ef;text-decoration:none;font-size:.75rem;font-weight:800}.dm-partner-actions a:first-child{background:#ff9f1c;color:#07111d;border-color:#ff9f1c}.dm-contact-row a:hover,.dm-partner-actions a:hover{border-color:#ff9f1c}@media(max-width:600px){.dm-partners-page{padding:18px 12px 72px}.dm-partner-card{grid-template-columns:1fr}.dm-partner-mark{width:64px;height:64px;border-radius:15px}}
    `}</style>
  </main>
}
