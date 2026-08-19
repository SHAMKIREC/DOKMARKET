import CollectiveSetup from "./CollectiveSetup";

const btnBase = { padding: 24, borderRadius: 12, textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", width: "100%" };

export default function Step2Mode({ claimData, updateClaimData, nextStep, prevStep }) {
  const isCollective = claimData.mode === "collective";
  const isIndividual = !isCollective;

  // If collective chosen, show setup wizard instead
  if (isCollective && !claimData.roomId) {
    return <CollectiveSetup claimData={claimData} updateClaimData={updateClaimData} nextStep={nextStep} prevStep={() => updateClaimData({ mode: "individual" })} />;
  }

  return (
    <div className="rounded-2xl p-8 border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
      <h3 className="text-xl font-bold text-white mb-6">Формат претензии</h3>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <button onClick={() => updateClaimData({ mode: "individual", roomId: null })}
          style={{ ...btnBase, border: `2px solid ${isIndividual ? "#0ea5e9" : "rgba(255,255,255,0.1)"}`, background: isIndividual ? "rgba(14,165,233,0.1)" : "rgba(255,255,255,0.03)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(14,165,233,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#22d3ee", fontSize: "1.2rem", marginBottom: 14 }}>
            <i className="fa-solid fa-user"></i>
          </div>
          <h4 style={{ fontWeight: 600, color: "white", marginBottom: 4 }}>Индивидуальная</h4>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Претензия от одного заявителя</p>
        </button>

        <button onClick={() => updateClaimData({ mode: "collective", roomId: null })}
          style={{ ...btnBase, border: `2px solid ${isCollective ? "#a78bfa" : "rgba(255,255,255,0.1)"}`, background: isCollective ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(167,139,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa", fontSize: "1.2rem", marginBottom: 14 }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <h4 style={{ fontWeight: 600, color: "white", marginBottom: 4 }}>Коллективная</h4>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Претензия от группы заявителей</p>
        </button>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <button onClick={prevStep} style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 600 }}>Назад</button>
        <button onClick={nextStep} style={{ flex: 2, minWidth: 140, padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", border: "none", color: "white", cursor: "pointer", fontWeight: 600 }}>Далее</button>
      </div>
    </div>
  );
}