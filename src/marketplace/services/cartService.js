import { readLocal, writeLocal } from "@/services/localStorageService";

const CART_KEY = "marketplace:cart";
const CART_TYPES = new Set(["ready_file", "guide", "bundle", "online_form"]);

export function isCartEligible(offer) {
  return Boolean(offer && CART_TYPES.has(offer.type) && Number(offer.price) > 0);
}

export function listCart() {
  return readLocal(CART_KEY, []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function isInCart(offerId) {
  return listCart().some(item => item.offerId === offerId);
}

export function addToCart(offer) {
  const items = listCart();
  if (!isCartEligible(offer) || items.some(item => item.offerId === offer.id)) return items;
  const next = [...items, { offerId: offer.id, createdAt: new Date().toISOString() }];
  writeLocal(CART_KEY, next);
  return next;
}

export function removeFromCart(offerId) {
  const next = listCart().filter(item => item.offerId !== offerId);
  writeLocal(CART_KEY, next);
  return next;
}

export function toggleCart(offer) {
  return isInCart(offer.id) ? removeFromCart(offer.id) : addToCart(offer);
}
