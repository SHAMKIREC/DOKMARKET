export default function NextSteps() {
  const steps = [
    { num: 1, icon: "fa-print", color: "#22d3ee", title: "Распечатайте претензию", desc: "Распечатайте документ в 2 экземплярах на листе А4." },
    { num: 2, icon: "fa-pen-nib", color: "#a78bfa", title: "Подпишите документ", desc: "Поставьте дату и подпись в конце каждого экземпляра." },
    { num: 3, icon: "fa-envelope", color: "#fb923c", title: "Отправьте заказным письмом", desc: "Отправьте по юридическому адресу ответчика заказным письмом с уведомлением о вручении. Сохраните чек и квитанцию." },
    { num: 4, icon: "fa-clock", color: "#4ade80", title: "Ожидайте ответа", desc: "Срок ответа — 10 рабочих дней. Если ответа нет — обратитесь в суд / Роспотребнадзор / ГИТ." },
    { num: 5, icon: "fa-copy", color: "#f472b6", title: "Сохраните второй экземпляр", desc: "Один экземпляр вручите лично под подпись или отправьте почтой, второй оставьте себе." },
  ];

  return (
    <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)", padding: "clamp(16px,5vw,32px)", marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(34,211,238,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#22d3ee", fontSize: "1.1rem", flexShrink: 0 }}>
          <i className="fa-solid fa-list-check"></i>
        </div>
        <div>
          <h3 style={{ fontWeight: 700, color: "white", fontSize: "1.1rem", marginBottom: 2 }}>Что делать дальше?</h3>
          <p style={{ color: "#9ca3af", fontSize: "0.8rem" }}>Следуйте этим шагам для максимального результата</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {steps.map(s => (
          <div key={s.num} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `rgba(${hexToRgb(s.color)},0.15)`, border: `2px solid ${s.color}`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>
              {s.num}
            </div>
            <div>
              <p style={{ fontWeight: 600, color: "white", marginBottom: 3, fontSize: "0.9rem" }}>
                <i className={`fa-solid ${s.icon}`} style={{ marginRight: 7, color: s.color }}></i>{s.title}
              </p>
              <p style={{ color: "#9ca3af", fontSize: "0.8rem", lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 12, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <p style={{ color: "#fbbf24", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }}></i>Важно для трудовых споров
        </p>
        <p style={{ color: "#d1d5db", fontSize: "0.8rem", lineHeight: 1.5 }}>
          При трудовом споре претензию направляйте одновременно работодателю и в Государственную инспекцию труда (ГИТ). Срок исковой давности по трудовым спорам — 3 месяца (ст. 392 ТК РФ).
        </p>
      </div>


    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}