import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { getEarlyAccessCounter } from "@/services/earlyAccessService";

const MAX_USERS = 1000;
const FALLBACK_USERS = 734;

function peopleWord(value) {
  const lastTwo = value % 100;
  const last = value % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "человек";
  if (last === 1) return "человек";
  if (last >= 2 && last <= 4) return "человека";
  return "человек";
}

export default function EarlyAccessBlock() {
  const [currentUsers, setCurrentUsers] = useState(FALLBACK_USERS);
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const percent = Math.min(100, Math.round((currentUsers / MAX_USERS) * 100));
  const remaining = Math.max(0, MAX_USERS - currentUsers);

  useEffect(() => {
    setCurrentUsers(getEarlyAccessCounter().registered_users ?? FALLBACK_USERS);
  }, []);

  useEffect(() => {
    if (!inView) return;
    const timeout = setTimeout(() => setAnimatedWidth(percent), 200);
    return () => clearTimeout(timeout);
  }, [inView, percent]);

  return (
    <motion.section ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .5 }} className="relative w-full" aria-labelledby="early-access-title">
      <div aria-hidden className="absolute inset-x-10 inset-y-0 rounded-3xl pointer-events-none" style={{ background: "rgba(99,102,241,.14)", filter: "blur(35px)" }} />
      <div className="relative grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr] gap-7 lg:gap-12 items-center rounded-3xl border border-indigo-400/20 px-5 py-7 sm:px-8 lg:px-10 lg:py-9" style={{ background: "rgba(255,255,255,.035)", backdropFilter: "blur(18px)", boxShadow: "0 12px 48px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.06)" }}>
        <div>
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              ["fa-gift", "Бесплатно на старте", "#4ade80"],
              ["fa-users", "Индивидуальные и коллективные претензии", "#38bdf8"],
              ["fa-star", "Ранний доступ", "#fbbf24"],
            ].map(([icon,label,color]) => <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ color, background: `${color}12`, border: `1px solid ${color}30` }}><i className={`fa-solid ${icon}`} />{label}</span>)}
          </div>
          <h2 id="early-access-title" className="text-2xl sm:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Ранний доступ открыт</h2>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl">Сейчас можно попробовать Досудебку бесплатно. После заполнения профиля доступ активируется автоматически.</p>
        </div>

        <div className="rounded-2xl border border-white/7 p-5 sm:p-6" style={{ background: "rgba(7,10,24,.4)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4"><span className="text-base font-semibold text-white">{currentUsers.toLocaleString("ru-RU")} из {MAX_USERS.toLocaleString("ru-RU")} мест занято</span><span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold text-violet-200 border border-violet-400/20" style={{ background: "rgba(139,92,246,.12)" }}>{remaining} мест осталось</span></div>
          <div className="relative h-3 rounded-full overflow-hidden mb-4" style={{ background: "rgba(255,255,255,.07)" }} role="progressbar" aria-valuemin="0" aria-valuemax={MAX_USERS} aria-valuenow={currentUsers} aria-label="Места в раннем доступе"><div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${animatedWidth}%`, background: "linear-gradient(90deg,#2563eb,#6366f1,#a855f7)", transition: "width 1.2s ease-out", boxShadow: "0 0 14px rgba(99,102,241,.45)" }} /></div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-gray-500"><span>Уже подключились: {currentUsers.toLocaleString("ru-RU")} {peopleWord(currentUsers)}</span><span>Лимит: {MAX_USERS.toLocaleString("ru-RU")} пользователей</span></div>
        </div>
      </div>
    </motion.section>
  );
}
