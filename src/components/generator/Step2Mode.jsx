import CollectiveSetup from "./CollectiveSetup";

const btnBase = {
  padding: 22,
  borderRadius: 16,
  textAlign: "left",
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
  width: "100%",
  transition: "transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease",
};

const modeInfo = {
  individual: {
    title: "Индивидуальная",
    short: "Один заявитель",
    description: "Подходит, если требование предъявляете только вы. Все суммы, обстоятельства, доказательства и подпись относятся к одному заявителю.",
    icon: "fa-user",
    accent: "#22d3ee",
    bg: "rgba(14,165,233,.10)",
    border: "#0ea5e9",
  },
  collective: {
    title: "Совместная",
    short: "Несколько заявителей",
    description: "Каждый участник заполняет свои данные и обстоятельства. В итоговый документ попадают только завершившие заполнение участники.",
    icon: "fa-users",
    accent: "#c4b5fd",
    bg: "rgba(139,92,246,.10)",
    border: "#a78bfa",
  },
};

export default function Step2Mode({ claimData, updateClaimData, nextStep, prevStep }) {
  const isCollective = claimData.mode === "collective";
  const isIndividual = !isCollective;
  const isLabor = claimData.type === "labor";

  if (isCollective && !claimData.roomId) {
    return (
      <CollectiveSetup
        claimData={claimData}
        updateClaimData={updateClaimData}
        nextStep={nextStep}
        prevStep={() => updateClaimData({ mode: "individual", collectiveKind: null })}
      />
    );
  }

  const chooseMode = mode => {
    if (mode === "collective") {
      updateClaimData({
        mode: "collective",
        roomId: null,
        collectiveKind: "joint_claim",
        collectiveFinalized: false,
      });
      return;
    }
    updateClaimData({
      mode: "individual",
      roomId: null,
      collectiveKind: null,
      collectiveFinalized: false,
    });
  };

  return (
    <div className="rounded-2xl border border-white/10" style={{ padding: "clamp(18px,4vw,30px)", background: "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))" }}>
      <style>{`
        .claim-mode-card:hover { transform: translateY(-2px); }
        .claim-mode-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
        .claim-mode-bullets { display:grid; gap:7px; margin-top:15px; }
        @media (max-width:700px){ .claim-mode-grid{grid-template-columns:1fr}.claim-mode-card{padding:18px!important} }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 9px", borderRadius: 999, color: "#a5f3fc", background: "rgba(8,145,178,.09)", border: "1px solid rgba(103,232,249,.16)", fontSize: ".7rem", fontWeight: 800, marginBottom: 10 }}>
          <i className="fa-solid fa-users-viewfinder" /> ШАГ 2 ИЗ 7
        </div>
        <h3 style={{ color: "#fff", fontSize: "clamp(1.25rem,4vw,1.6rem)", fontWeight: 800, margin: "0 0 7px" }}>Кто подаёт претензию?</h3>
        <p style={{ color: "#94a3b8", fontSize: ".86rem", lineHeight: 1.6, margin: 0 }}>Выберите формат. Это влияет на состав заявителей, подписи и структуру итогового документа.</p>
      </div>

      <div className="claim-mode-grid">
        {[
          ["individual", isIndividual],
          ["collective", isCollective],
        ].map(([mode, active]) => {
          const info = modeInfo[mode];
          return (
            <button
              key={mode}
              type="button"
              className="claim-mode-card"
              onClick={() => chooseMode(mode)}
              style={{
                ...btnBase,
                border: `1.5px solid ${active ? info.border : "rgba(255,255,255,.10)"}`,
                background: active ? info.bg : "rgba(255,255,255,.025)",
                boxShadow: active ? `0 14px 34px ${mode === "collective" ? "rgba(139,92,246,.10)" : "rgba(14,165,233,.10)"}` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: mode === "collective" ? "rgba(167,139,250,.14)" : "rgba(14,165,233,.14)", display: "grid", placeItems: "center", color: info.accent, fontSize: "1.05rem", flexShrink: 0 }}>
                  <i className={`fa-solid ${info.icon}`} />
                </div>
                <span style={{ width: 21, height: 21, borderRadius: "50%", border: `2px solid ${active ? info.accent : "#475569"}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {active && <span style={{ width: 9, height: 9, borderRadius: "50%", background: info.accent }} />}
                </span>
              </div>
              <h4 style={{ fontWeight: 800, color: "white", margin: "15px 0 3px", fontSize: "1rem" }}>{info.title}</h4>
              <div style={{ color: info.accent, fontSize: ".72rem", fontWeight: 800, marginBottom: 9 }}>{info.short}</div>
              <p style={{ fontSize: ".79rem", lineHeight: 1.58, color: "#9ca3af", margin: 0 }}>{info.description}</p>
            </button>
          );
        })}
      </div>

      {isCollective && isLabor && (
        <div style={{ marginTop: 15, padding: "13px 14px", borderRadius: 13, background: "rgba(245,158,11,.07)", border: "1px solid rgba(245,158,11,.22)", color: "#d8dee9", fontSize: ".77rem", lineHeight: 1.58 }}>
          <strong style={{ color: "#fbbf24" }}><i className="fa-solid fa-circle-info" style={{ marginRight: 7 }} />Важно для трудового спора.</strong>{" "}
          Этот режим формирует совместное обращение нескольких работников. Он не означает автоматически «коллективный трудовой спор» в специальном смысле ТК РФ: такой спор имеет отдельную процедуру и представительство работников.
        </div>
      )}

      {isCollective && (
        <div className="claim-mode-bullets" style={{ padding: "14px", borderRadius: 13, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)", color: "#94a3b8", fontSize: ".75rem", lineHeight: 1.5 }}>
          <div><i className="fa-solid fa-link" style={{ width: 19, color: "#a78bfa" }} />Организатор создаёт ссылку для остальных участников.</div>
          <div><i className="fa-solid fa-user-check" style={{ width: 19, color: "#a78bfa" }} />Каждый участник самостоятельно подтверждает свои данные.</div>
          <div><i className="fa-solid fa-file-signature" style={{ width: 19, color: "#a78bfa" }} />Перед генерацией показываем, кто именно попадёт в итоговый документ.</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
        <button type="button" onClick={prevStep} style={{ flex: 1, minWidth: 105, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.1)", color: "white", cursor: "pointer", fontWeight: 700 }}>Назад</button>
        <button type="button" onClick={nextStep} disabled={isCollective && !claimData.roomId} style={{ flex: 2, minWidth: 150, padding: "12px 14px", borderRadius: 12, background: "linear-gradient(135deg,#0891b2,#7c3aed)", border: "none", color: "white", cursor: "pointer", fontWeight: 800, boxShadow: "0 10px 28px rgba(79,70,229,.2)" }}>Далее</button>
      </div>
    </div>
  );
}
