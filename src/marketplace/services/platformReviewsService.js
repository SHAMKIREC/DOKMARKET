import { SUPABASE_URL, SUPABASE_ANON_KEY, restRequest } from "@/lib/supabaseRest";

async function parse(response) {
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(data?.message || data?.error || `HTTP_${response.status}`);
  return data;
}

export async function listApprovedPlatformReviews() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/platform_reviews?status=eq.approved&select=id,author_name,rating,title,body,created_at&order=created_at.desc`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  return parse(response);
}

export async function createPlatformReview({ userId, authorName, rating, title, body }) {
  const rows = await restRequest("platform_reviews", {
    method: "POST",
    body: {
      user_id: userId,
      author_name: authorName?.trim() || null,
      rating: Number(rating),
      title: title?.trim() || null,
      body: body.trim(),
      source: "platform",
      status: "pending",
    },
    prefer: "return=representation",
  });
  return Array.isArray(rows) ? rows[0] || null : rows;
}
