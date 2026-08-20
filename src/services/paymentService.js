const FUNCTIONS_BASE = "https://yjmfnjulpqpkndcfcuet.supabase.co/functions/v1";
const PAYMENT_TOKEN_KEY = "dokmarket-payment-token";

async function postFunction(name, payload) {
  const response = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error || "PAYMENT_REQUEST_FAILED");
    error.details = data?.details;
    throw error;
  }
  return data;
}

export function storePaymentToken(token) {
  if (!token) return;
  localStorage.setItem(PAYMENT_TOKEN_KEY, token);
}

export function getStoredPaymentToken() {
  try { return localStorage.getItem(PAYMENT_TOKEN_KEY) || ""; }
  catch { return ""; }
}

export function clearStoredPaymentToken() {
  try { localStorage.removeItem(PAYMENT_TOKEN_KEY); } catch { /* ignore */ }
}

export async function createPayment({ mode, memberCount, category }) {
  const url = new URL(window.location.href);
  url.searchParams.set("payment", "return");
  const data = await postFunction("create-payment", {
    mode,
    memberCount,
    category,
    returnUrl: url.toString(),
  });
  if (!data?.clientToken || !data?.confirmationUrl) throw new Error("PAYMENT_CONFIRMATION_MISSING");
  storePaymentToken(data.clientToken);
  return data;
}

export async function checkPayment(clientToken = getStoredPaymentToken()) {
  if (!clientToken) return { paid: false, status: "missing" };
  return postFunction("check-payment", { clientToken });
}
