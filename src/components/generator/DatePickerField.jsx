import { useState, useRef, useEffect, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

function formatDate(date) {
  if (!date) return "";
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

export default function DatePickerField({ value, onChange, placeholder = "ДД.ММ.ГГГГ", style }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selected, setSelected] = useState(undefined);
  const [ageError, setAgeError] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (value && typeof value === "string" && /^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
      const parts = value.split(".");
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
        setSelected(date);
        setInputValue(value);
        validateAge(date);
        return;
      }
    }
    setInputValue("");
    setSelected(undefined);
    setAgeError("");
  }, [value]);

  const validateAge = useCallback((date) => {
    if (!date) { setAgeError(""); return; }
    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    const mDiff = now.getMonth() - date.getMonth();
    if (mDiff < 0 || (mDiff === 0 && now.getDate() < date.getDate())) age--;
    if (age < 18) {
      setAgeError("Заявитель должен быть совершеннолетним (≥ 18 лет)");
    } else if (age > 120) {
      setAgeError("Некорректная дата рождения");
    } else {
      setAgeError("");
    }
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleDaySelect(date) {
    setSelected(date);
    const formatted = formatDate(date);
    setInputValue(formatted);
    validateAge(date);
    onChange(formatted);
    setOpen(false);
  }

  function handleClear() {
    setInputValue("");
    setSelected(undefined);
    setAgeError("");
    onChange("");
  }

  const defaultStyle = {
    width: "100%", padding: "12px 40px 12px 16px", borderRadius: 12,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "white", fontSize: "0.875rem", outline: "none", cursor: "pointer",
    fontFamily: "inherit"
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        {/* Click-to-open calendar — readOnly prevents manual typing */}
        <input
          type="text"
          value={inputValue}
          readOnly
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(o => !o)}
          placeholder={placeholder}
          maxLength={10}
          style={{
            ...defaultStyle,
            ...(style || {}),
            cursor: "pointer",
            caretColor: "transparent",
          }}
        />
        <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}>
          {inputValue && (
            <button type="button" onClick={(e) => { e.stopPropagation(); handleClear(); }}
              style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "4px 6px", fontSize: "0.85rem", lineHeight: 1 }}>
              <i className="fa-solid fa-times"></i>
            </button>
          )}
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
            style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: "4px 6px", fontSize: "0.9rem", lineHeight: 1 }}>
            <i className="fa-regular fa-calendar"></i>
          </button>
        </div>
      </div>
      {ageError && (
        <p style={{ color: "#f43f5e", fontSize: "0.7rem", marginTop: 3 }}>{ageError}</p>
      )}
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, zIndex: 50, marginTop: 4,
          background: "#1e293b", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14,
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)", padding: 8
        }}>
          <style>{`
            .rdp { --rdp-background-color: rgba(14,165,233,0.2); --rdp-accent-color: #0ea5e9; --rdp-day-width: 36px; --rdp-day-height: 36px; margin: 0; }
            .rdp-months { justify-content: center; }
            .rdp-caption_label { color: white !important; font-weight: 600; font-size: 0.9rem; }
            .rdp-head_cell { color: #9ca3af !important; font-weight: 600; font-size: 0.75rem; }
            .rdp-day { color: #e2e8f0 !important; font-size: 0.82rem; border-radius: 8px; }
            .rdp-day:hover { background: rgba(14,165,233,0.15) !important; }
            .rdp-day_selected { background: #0ea5e9 !important; color: white !important; font-weight: 700; }
            .rdp-day_outside { color: #475569 !important; }
            .rdp-nav_button { color: #9ca3af !important; }
            .rdp-nav_button:hover { background: rgba(255,255,255,0.1) !important; }
          `}</style>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDaySelect}
            showOutsideDays
            fixedWeeks
            fromYear={1900}
            toYear={new Date().getFullYear() - 18}
            defaultMonth={selected || new Date(1990, 0)}
            captionLayout="dropdown-buttons"
            formatters={{
              formatCaption: (date) => `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
            }}
          />
        </div>
      )}
    </div>
  );
}