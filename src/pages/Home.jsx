import { useEffect, useState } from "react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { getEarlyLaunchStats } from "@/services/authService";

const categories = [
  { icon: "fa-money-bill-wave", bg: "#0e7490", title: "Не выплатили зарплату", desc: "Задержка зарплаты, увольнение, расчёт" },
  { icon: "fa-rotate-left", bg: "#7c3aed", title: "Нужно вернуть деньги", desc: "Товар с браком, услуги, онлайн-курс" },
  { icon: "fa-hand-holding-dollar", bg: "#15803d", title: "Должник не возвращает долг", desc: "Расписка, займ, договорённость" },
  { icon: "fa-file-circle-question", bg: "#c2410c", title: "Другая ситуация", desc: "Опишите проблему, сервис подскажет шаги" },
];

const results = ["Готовая претензия", "Статьи закона внутри документа", "Список требований к нарушителю", "Инструкция: куда и как отправить"];
const situations = ["не вернули деньги", "не выплатили зарплату", "продали товар с браком", "не возвращают долг"];
const steps = [
  { icon: "fa-list-check", title: "Выберите ситуацию" },
  { icon: "fa-message", title: "Ответьте на вопросы" },
  { icon: "fa-file-arrow-down", title: "Скачайте претензию" },
];
const benefits = [
  { icon: "fa-comments", text: "Без сложных юридических слов" },
  { icon: "fa-scale-balanced", text: "Статьи закона подставляются автоматически" },
  { icon: "fa-user", text: "Подходит для физических лиц" },
  { icon: "fa-user-tie", text: "Можно показать юристу перед отправкой" },
];
const telegramSupportUrl = "https://t.me/+mxSPQZosRBAwMTMy";
const totalEarlyAccessSlots = 1000;

export default function Home() {
  const [earlyLaunchStats, setEarlyLaunchStats] = useState(() => getEarlyLaunchStats());
  const reportedEarlyAccessUsers = Number(earlyLaunchStats.used) || 0;
  const usedEarlyAccessSlots = Math.min(totalEarlyAccessSlots, Math.max(0, reportedEarlyAccessUsers || 3));
  const remainingEarlyAccessSlots = totalEarlyAccessSlots - usedEarlyAccessSlots;
  const progressPercent = Math.min(100, Math.max(0, (usedEarlyAccessSlots / totalEarlyAccessSlots) * 100));

  useEffect(() => {
    const refreshStats = () => setEarlyLaunchStats(getEarlyLaunchStats());
    window.addEventListener("storage", refreshStats);
    return () => window.removeEventListener("storage", refreshStats);
  }, []);

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 items-start gap-x-10 gap-y-8 mb-12 lg:grid-cols-[1.12fr_.88fr] lg:gap-x-14 lg:gap-y-10 lg:mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-cyan-300 text-xs sm:text-sm font-semibold border border-cyan-500/20 mb-6" style={{ background: "rgba(255,255,255,.035)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Претензия без юриста за 5 минут
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.35rem] xl:text-6xl font-bold leading-[1.08] text-white mb-5" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
              Составьте официальную претензию
              <span className="block mt-2" style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8 52%,#c084fc)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>без сложных юридических слов</span>
            </h1>

            <p className="text-lg sm:text-xl font-semibold text-indigo-200 leading-relaxed mb-4">Для возврата денег, зарплаты, долгов, товаров и онлайн-курсов</p>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-4 max-w-3xl">Ответьте на несколько вопросов, а Досудебка подготовит документ с нужными статьями закона, требованиями и инструкцией по отправке.</p>
            <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-violet-400/50 pl-4 mb-8 max-w-2xl">Претензия — это официальное требование решить проблему до суда: вернуть деньги, выплатить долг, устранить нарушение или дать письменный ответ.</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <Link to={createPageUrl("Generator")} className="px-7 py-4 rounded-full font-semibold text-white text-base sm:text-lg inline-flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", boxShadow: "0 12px 35px rgba(79,70,229,.25)" }}><i className="fa-solid fa-wand-magic-sparkles" />Создать претензию</Link>
              <Link to={createPageUrl("Pricing")} className="px-7 py-4 rounded-full font-semibold text-white border border-white/10 inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-colors" style={{ background: "rgba(255,255,255,.035)" }}><i className="fa-solid fa-tag text-amber-400" />Сколько стоит</Link>
            </div>
          </div>

          <div className="self-start">
            <aside className="relative rounded-3xl border border-indigo-400/20 p-6 sm:p-8 overflow-hidden" style={{ background: "linear-gradient(145deg,rgba(30,41,80,.78),rgba(17,16,40,.82))", boxShadow: "0 24px 70px rgba(30,27,75,.34),inset 0 1px 0 rgba(255,255,255,.07)" }}>
              <div className="relative">
                <div className="flex items-center gap-3 mb-6"><span className="w-11 h-11 rounded-xl flex items-center justify-center text-cyan-300" style={{ background: "rgba(56,189,248,.1)", border: "1px solid rgba(56,189,248,.2)" }}><i className="fa-solid fa-file-circle-check text-lg" /></span><h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Что получится на выходе</h2></div>
                <div className="space-y-3 mb-7">{results.map(text => <div key={text} className="flex items-center gap-3 text-sm sm:text-base text-gray-200"><span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-emerald-300 text-xs" style={{ background: "rgba(52,211,153,.1)" }}><i className="fa-solid fa-check" /></span>{text}</div>)}</div>
                <div className="rounded-2xl border border-white/8 p-5" style={{ background: "rgba(5,8,20,.38)" }}><h3 className="text-sm font-semibold text-white mb-3">Подходит, если:</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">{situations.map(text => <span key={text} className="text-xs text-gray-400 inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />{text}</span>)}</div></div>
              </div>
            </aside>
          </div>

          <aside className="rounded-2xl border border-cyan-300/25 p-4 sm:p-5 lg:col-span-2" style={{ background: "linear-gradient(135deg,rgba(8,145,178,.1),rgba(124,58,237,.11)),rgba(15,23,42,.56)", boxShadow: "0 14px 34px rgba(2,8,23,.2),inset 0 1px 0 rgba(255,255,255,.06)" }} aria-labelledby="home-early-access-title">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(230px,.8fr)_auto] md:items-center">
              <div>
                <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-cyan-200" style={{ background: "rgba(8,145,178,.12)" }}><i className="fa-solid fa-bolt" />Ранний запуск</span>
                <h2 id="home-early-access-title" className="text-base font-bold leading-snug text-white sm:text-lg">Первые 1000 пользователей тестируют бесплатно</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-300 sm:text-sm">Создайте первую претензию и проверьте результат до полноценного запуска.</p>
              </div>
              <div className="rounded-xl border border-white/10 px-3.5 py-3.5" style={{ background: "rgba(5,8,20,.38)" }}>
                <div className="mb-1 text-sm font-bold text-violet-100">Занято: {usedEarlyAccessSlots} из {totalEarlyAccessSlots}</div>
                <div className="mb-2.5 text-xs text-gray-400">Свободно: {remainingEarlyAccessSlots} мест</div>
                <div className="h-2.5 overflow-hidden rounded-full border border-indigo-300/10 bg-indigo-950/45" role="progressbar" aria-label="Занятые места раннего запуска" aria-valuemin="0" aria-valuemax={totalEarlyAccessSlots} aria-valuenow={usedEarlyAccessSlots}><div className="h-full rounded-full" style={{ width: `${progressPercent}%`, minWidth: usedEarlyAccessSlots > 0 ? 28 : 0, background: "linear-gradient(90deg,#22d3ee,#7c3aed)", boxShadow: "0 0 12px rgba(34,211,238,.35)", transition: "width .35s ease" }} /></div>
              </div>
              <Link to="/Register" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-300/20 px-4 py-3 text-center text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-300/10">Попробовать бесплатно после регистрации <i className="fa-solid fa-arrow-right text-[9px]" /></Link>
            </div>
          </aside>
        </section>

        <section className="mt-10 mb-20 lg:mt-14" aria-labelledby="situations-title">
          <div className="max-w-2xl mb-9"><h2 id="situations-title" className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>С какой проблемой вы столкнулись?</h2><p className="text-gray-400">Выберите похожую ситуацию — детали можно уточнить на следующем шаге.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">{categories.map(item => <article key={item.title} className="rounded-2xl p-6 border border-white/10 transition-all hover:-translate-y-1 hover:border-indigo-400/25" style={{ background: "rgba(255,255,255,.035)" }}><div style={{ width: 50, height: 50, borderRadius: 14, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><i className={`fa-solid ${item.icon}`} style={{ color: "white", fontSize: 20 }} /></div><h3 className="font-semibold text-white text-lg leading-snug mb-2">{item.title}</h3><p className="text-sm leading-relaxed text-gray-400">{item.desc}</p></article>)}</div>
        </section>

        <section className="mb-20" aria-labelledby="how-title">
          <div className="text-center mb-10"><h2 id="how-title" className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Как это работает</h2><p className="text-gray-400">Три шага — и у вас готовый документ.</p></div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5"><div aria-hidden className="hidden md:block absolute top-10 left-[17%] right-[17%] h-px" style={{ background: "linear-gradient(90deg,transparent,#6366f1,#8b5cf6,transparent)" }} />{steps.map((step,index) => <article key={step.title} className="relative rounded-2xl p-7 text-center border border-indigo-400/15" style={{ background: "linear-gradient(145deg,rgba(99,102,241,.09),rgba(255,255,255,.025))" }}><div className="relative z-10 w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center text-indigo-200 text-xl" style={{ background: "#17172b", border: "1px solid rgba(129,140,248,.3)", boxShadow: "0 0 25px rgba(99,102,241,.15)" }}><i className={`fa-solid ${step.icon}`} /></div><span className="text-xs text-indigo-300 font-semibold">Шаг {index + 1}</span><h3 className="text-white font-semibold text-lg mt-2">{step.title}</h3></article>)}</div>
          <p className="text-center text-sm text-gray-400 mt-7">Документ можно сохранить в PDF/DOCX и отправить по инструкции.</p>
        </section>

        <section className="rounded-3xl border border-white/10 p-6 sm:p-10 lg:p-12" style={{ background: "radial-gradient(circle at top,rgba(99,102,241,.14),rgba(255,255,255,.025) 62%)" }} aria-labelledby="trust-title">
          <div className="grid lg:grid-cols-[.72fr_1.28fr] gap-8 lg:gap-12 items-center"><div><h2 id="trust-title" className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Понятный документ с опорой на закон</h2><p className="text-sm text-gray-500 leading-relaxed">Сервис помогает подготовить документ, но не заменяет индивидуальную консультацию юриста.</p></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{benefits.map(item => <div key={item.text} className="flex items-center gap-4 rounded-xl border border-white/5 p-4" style={{ background: "rgba(10,10,15,.42)" }}><span className="w-10 h-10 rounded-xl flex items-center justify-center text-cyan-300 shrink-0" style={{ background: "rgba(56,189,248,.1)" }}><i className={`fa-solid ${item.icon}`} /></span><span className="text-sm text-gray-200">{item.text}</span></div>)}</div></div>
        </section>

        <section className="mt-12 rounded-2xl border border-cyan-300/20 p-5 sm:p-6" style={{ background: "linear-gradient(135deg,rgba(8,145,178,.08),rgba(124,58,237,.09)),rgba(15,23,42,.58)", boxShadow: "0 16px 38px rgba(2,8,23,.22),inset 0 1px 0 rgba(255,255,255,.05)" }} aria-labelledby="telegram-support-title">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl text-cyan-200" style={{ background: "linear-gradient(135deg,rgba(34,211,238,.16),rgba(124,58,237,.2))", border: "1px solid rgba(103,232,249,.2)" }}><i className="fa-brands fa-telegram" /></span>
            <div className="min-w-0 flex-1">
              <h2 id="telegram-support-title" className="text-lg font-bold text-white sm:text-xl">Поддержка и новости Досудебки</h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-400">В Telegram можно задать вопрос, следить за обновлениями сервиса и узнать о новых шаблонах претензий.</p>
            </div>
            <a href={telegramSupportUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/25 px-5 py-3 text-sm font-bold text-cyan-100 transition-colors hover:bg-cyan-300/10 sm:w-auto"><i className="fa-brands fa-telegram" />Открыть Telegram</a>
          </div>
        </section>

        <footer className="mt-12 border-t border-white/10 py-6 text-center text-xs leading-relaxed text-gray-500">
          © 2026 Досудебка — генерация юридических документов по законодательству РФ
        </footer>
      </div>
    </div>
  );
}
