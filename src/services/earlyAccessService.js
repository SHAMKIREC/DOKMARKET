import { readLocal, writeLocal } from "./localStorageService";

const COUNTER_KEY = "early-access";
const DEFAULT_COUNTER = { registered_users: 734, max_users: 1000 };

export function getEarlyAccessCounter() {
  return readLocal(COUNTER_KEY, DEFAULT_COUNTER);
}

export function incrementEarlyAccessCounter() {
  const counter = getEarlyAccessCounter();
  if (counter.registered_users >= counter.max_users) return counter;
  return writeLocal(COUNTER_KEY, { ...counter, registered_users: counter.registered_users + 1 }) || counter;
}
