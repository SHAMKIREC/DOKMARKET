import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { createPlatformReview, listApprovedPlatformReviews } from "@/marketplace/services/platformReviewsService";
import { MarketFrame, MarketNavigation } from "./Market";

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
    if (body.trim().length < 10) return setStatus("Напишите хотя бы несколько предложений о вашем опыте.");
    try {
      setStatus("Отправляем отзыв…");
      await createPlatformReview({ userId: user.id, authorName: user.fullName || user.name || user.email?.split("@")[0], rating, title, body });
      setTitle(""); setBody(""); setRating(5);
      setStatus("Спасибо. Отзыв сохранён и появится после модерации.");
    } catch {
      setStatus("Не удалось отправить отзыв. Попробуйте ещё раз.");
    }
  }

  return <MarketFrame>
    <MarketNavigation crumbs={[{ label:"ДокМаркет", to:"/" }, { label:"Отзывы" }]} backTo="/" />
    <section className="market-hero market-glass dm-reviews-hero">
      <div>
        <span className="market-kicker"><i className="fa-solid fa-comments" />Отзывы о ДокМаркете</span>
        <h1 className="market-title">Что говорят о платформе</h1>
        <p className="market-subtitle">Здесь только отзывы о самом ДокМаркете: удобстве, документах, сервисах и работе платформы.</p>
      </div>
      <div className="dm-review-score">
        <strong>{average || "—"}</strong>
        <span>{reviews.length ? `${reviews.length} подтверждённых отзывов` : "Пока нет опубликованных отзывов"}</span>
      </div>
    </section>

    <section className="dm-review-layout">
      <div>
        <h2 className="market-heading">Отзывы пользователей</h2>
        <p className="market-lead">Публикуются после модерации. Отзывы специалистов и отзывы о конкретных документах будут храниться отдельно.</p>
        {loading ? <div className="market-empty market-glass">Загружаем отзывы…</div> : reviews.length ? <div className="dm-review-grid">{reviews.map(review => <article className="market-card market-glass dm-review-card" key={review.id}>
          <div className="dm-review-stars" aria-label={`${review.rating} из 5`}>{Array.from({length:5},(_,i)=><i key={i} className={`${i < review.rating ? "fa-solid" : "fa-regular"} fa-star`} />)}</div>
          {review.title && <h2>{review.title}</h2>}
          <p>{review.body}</p>
          <small>{review.author_name || "Пользователь ДокМаркета"}</small>
        </article>)}</div> : <div className="market-empty market-glass"><i className="fa-regular fa-message" /><h2>Будьте первым</h2><p>Здесь не будет вымышленных отзывов. Первый настоящий отзыв появится после использования платформы и модерации.</p></div>}
      </div>

      <form className="market-panel market-glass dm-review-form" onSubmit={submit}>
        <span className="market-kicker">Оставить отзыв</span>
        <h2 className="market-heading">Как вам ДокМаркет?</h2>
        <label>Оценка<div className="dm-rating-picker">{[1,2,3,4,5].map(value=><button type="button" key={value} aria-label={`${value} из 5`} onClick={()=>setRating(value)}><i className={`${value <= rating ? "fa-solid" : "fa-regular"} fa-star`} /></button>)}</div></label>
        <label>Короткий заголовок<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={100} placeholder="Например: всё понятно с первого раза" /></label>
        <label>Ваш отзыв<textarea value={body} onChange={e=>setBody(e.target.value)} maxLength={2000} rows={6} placeholder="Что было удобно, что стоит улучшить?" /></label>
        {user ? <button className="market-primary" type="submit">Отправить отзыв</button> : <Link className="market-primary" to="/Login">Войти и оставить отзыв</Link>}
        {status && <p className="dm-review-status">{status}</p>}
      </form>
    </section>
  </MarketFrame>;
}
