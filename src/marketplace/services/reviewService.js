import { publicRestRequest, restRequest } from "@/lib/supabaseRest";

export async function listSellerReviews(sellerId, limit = 30) {
  if (!sellerId) return [];
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 30));
  const rows = await publicRestRequest(`marketplace_reviews?seller_id=eq.${encodeURIComponent(sellerId)}&status=eq.published&select=id,order_id,rating,review_text,created_at&order=created_at.desc&limit=${safeLimit}`);
  return Array.isArray(rows) ? rows : [];
}

export async function getMyReviewForOrder(orderId, userId) {
  if (!orderId || !userId) return null;
  const rows = await restRequest(`marketplace_reviews?order_id=eq.${encodeURIComponent(orderId)}&reviewer_id=eq.${encodeURIComponent(userId)}&select=*`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function createVerifiedOrderReview({ orderId, reviewerId, sellerId, rating, text }) {
  if (!orderId || !reviewerId || !sellerId) throw new Error("REQUIRED_FIELDS");
  const normalizedRating = Math.max(1, Math.min(5, Number(rating) || 0));
  const reviewText = String(text || "").trim();
  if (reviewText.length < 10) throw new Error("REVIEW_TOO_SHORT");
  const rows = await restRequest("marketplace_reviews", {
    method: "POST",
    body: {
      order_id: orderId,
      reviewer_id: reviewerId,
      seller_id: sellerId,
      rating: normalizedRating,
      review_text: reviewText,
      status: "published",
    },
    prefer: "return=representation",
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}
