import { readLocal, writeLocal } from "@/services/localStorageService";

const FAVORITES_KEY = "marketplace:favorites";

export function listFavorites() {
  return readLocal(FAVORITES_KEY, []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function isFavorite(id, type) {
  return listFavorites().some(item => item.id === id && item.type === type);
}

export function addFavorite(id, type) {
  if (!id || !["offer", "specialist"].includes(type)) return listFavorites();
  const items = listFavorites();
  if (items.some(item => item.id === id && item.type === type)) return items;
  const next = [...items, { id, type, createdAt: new Date().toISOString() }];
  writeLocal(FAVORITES_KEY, next);
  return next;
}

export function removeFavorite(id, type) {
  const next = listFavorites().filter(item => item.id !== id || item.type !== type);
  writeLocal(FAVORITES_KEY, next);
  return next;
}

export function toggleFavorite(id, type) {
  return isFavorite(id, type) ? removeFavorite(id, type) : addFavorite(id, type);
}
