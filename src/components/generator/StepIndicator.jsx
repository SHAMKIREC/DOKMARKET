export default function StepIndicator({ currentStep, totalSteps }) {
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.875rem", color: "#9ca3af" }}>
        <span>Шаг {currentStep} из {totalSteps}</span>
        <span>{percent}%</span>
      </div>
      <div style={{ height: 8, background: "#1f2937", borderRadius: 9999, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ height: "100%", width: `${percent}%`, background: "linear-gradient(90deg,#0ea5e9,#8b5cf6)", borderRadius: 9999, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          return (
            <div key={step} style={{
              width: 40, height: 40, borderRadius: "50%",
              border: `2px solid ${isActive ? "#0ea5e9" : isCompleted ? "#10b981" : "#4b5563"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.875rem", fontWeight: 700,
              background: isActive ? "linear-gradient(135deg,#0ea5e9,#8b5cf6)" : isCompleted ? "rgba(16,185,129,0.2)" : "transparent",
              color: isActive ? "white" : isCompleted ? "#10b981" : "#9ca3af",
            }}>
              {isCompleted ? <i className="fa-solid fa-check" style={{ fontSize: 12 }}></i> : step}
            </div>
          );
        })}
      </div>
    </div>
  );
}