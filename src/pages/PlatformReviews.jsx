import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { createPlatformReview, listApprovedPlatformReviews } from "@/marketplace/services/platformReviewsService";
import { MarketFrame, MarketNavigation } from "./Market";

function Stars({ value }) {
  return <span aria-label={`${value} из 5`} style={{ color: "#facc15", letterSpacing: 2, fontSize: "1rem" }}>{[1,2,3,4,5].map(star => <span key={star}>{star <= value ? "★" : "☆"}</span>)}</span>;
}

export default function PlatformReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const average = useMemo(() => reviews.length ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1) : null, [reviews]);

  useEffect(() => {
    let mounted = true;
    listApprovedPlatformReviews().then(data => mounted && setReviews(Array.isArray(data) ? data : [])).catch(() => {}).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!user) return setStatus("Чтобы оставить отзыв, войдите в аккаунт.");
    if (body.trim().length < 10) return setStatus("Напишите немного подробнее о своём опыте.");
    try {
      setStatus("Отправляем отзыв…");
      await createPlatformReview({ userId: user.id, authorName: user.fullName || user.name || user.email?.split("@")[0], rating, title, body });
      setTitle("");
      setBody("");
      setRating(5);
      setStatus("Спасибо. Отзыв сохранён и появится после модерации.");
    } catch {
      setStatus("Не удалось отправить отзыв. Попробуйте ещё раз.");
    }
  }

  return <MarketFrame>
    <style>{`
      .dm-review-compact{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(300px,.7fr);gap:18px;align-items:start}
      .dm-review-form-compact{display:grid;gap:12px;padding:20px!important}
      .dm-review-form-compact label{display:grid;gap:7px;color:#cbd5e1;font-size:.8rem;font-weight:700}
      .dm-review-form-compact input,.dm-review-form-compact textarea{width:100%;box-sizing:border-box;border:1px solid rgba(148,163,184,.17);border-radius:12px;background:rgba(2,6,23,.48);color:#fff;padding:11px 12px;outline:none;font:inherit}
      .dm-review-form-compact textarea{resize:vertical;min-height:112px}
      .dm-rating-text{display:flex;gap:5px}.dm-rating-text button{width:42px;height:42px;border:1px solid rgba(148,163,184,.14);border-radius:11px;background:rgba(255,255,255,.025);color:#64748b;font-size:1.35rem;line-height:1;cursor:pointer}.dm-rating-text button.active{color:#facc15;border-color:rgba(250,204,21,.28);background:rgba(250,204,21,.06)}
      @media(max-width:760px){.dm-review-compact{grid-template-columns:1fr}.dm-reviews-hero{padding:18px!important}.dm-review-form-compact{padding:16px!important}.dm-rating-text button{width:40px;height:40px}.dm-review-card{min-height:0!important;padding:16px!important}}
    `}</style>
    <MarketNavigation crumbs={[{ label:"ДокМаркет", to:"/" }, { label:"Отзывы" }]} backTo="/" />

    <section className="market-hero market-glass dm-reviews-hero">
      <div>
        <span className="market-kicker">Отзывы о ДокМаркете</span>
        <h1 className="market-title">Отзывы покупателей</h1>
        <p className="market-subtitle">Отзывы о платформе публикуются после модерации. Отзывы о документах и специалистах будут привязаны к конкретным заказам.</p>
      </div>
      <div className="dm-review-score"><strong>{average || "—"}</strong><span>{reviews.length ? `${reviews.length} отзывов` : "Пока нет опубликованных отзывов"}</span></div>
    </section>

    <section className="dm-review-compact">
      <div>
        <h2 className="market-heading">Что пишут пользователи</h2>
        <p className="market-lead">Без вымышленных оценок и профилей.</p>
        {loading ? <div className="market-empty market-glass">Загружаем отзывы…</div> : reviews.length ? <div className="dm-review-grid">{reviews.map(review => <article className="market-card market-glass dm-review-card" key={review.id}>
          <Stars value={Number(review.rating || 0)} />
          {review.title && <h2>{review.title}</h2>}
          <p>{review.body}</p>
          <small>{review.author_name || "Пользователь ДокМаркета"}</small>
        </article>)}</div> : <div className="market-empty market-glass"><h2>Пока отзывов нет</h2><p>Первый настоящий отзыв появится после использования платформы и модерации.</p></div>}
      </div>

      <form className="market-panel market-glass dm-review-form-compact" onSubmit={submit}>
        <div><span className="market-kicker">Оставить отзыв</span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Оцените ДокМаркет</h2></div>
        <label>Оценка<div className="dm-rating-text">{[1,2,3,4,5].map(value => <button className={value <= rating ? "active" : ""} type="button" key={value} aria-label={`${value} из 5`} onClick={() => setRating(value)}>★</button>)}</div></label>
        <label>Заголовок<input value={title} onChange={event => setTitle(event.target.value)} maxLength={100} placeholder="Например: быстро нашёл нужный документ" /></label>
        <label>Отзыв<textarea value={body} onChange={event => setBody(event.target.value)} maxLength={2000} rows={4} placeholder="Что было удобно? Что стоит улучшить?" /></label>
        {user ? <button className="market-primary" type="submit">Отправить отзыв</button> : <Link className="market-primary" to="/Login">Войти и оставить отзыв</Link>}
        {status && <p className="dm-review-status">{status}</p>}
      </form>
    </section>
  </MarketFrame>;
}
