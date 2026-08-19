const PREFIX = "dosudebka";

function storage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

function key(name) {
  return `${PREFIX}:${name}`;
}

export function readLocal(name, fallback) {
  try {
    const value = storage()?.getItem(key(name));
    return value === null || value === undefined ? fallback : JSON.parse(value);
  } catch {
    console.error("Не удалось прочитать локальные данные.");
    return fallback;
  }
}

export function writeLocal(name, value) {
  try {
    const target = storage();
    if (!target) return null;
    target.setItem(key(name), JSON.stringify(value));
    return value;
  } catch {
    console.error("Не удалось сохранить локальные данные.");
    return null;
  }
}

export function removeLocal(name) {
  try {
    storage()?.removeItem(key(name));
    return true;
  } catch {
    console.error("Не удалось удалить локальные данные.");
    return false;
  }
}

export function createLocalId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
