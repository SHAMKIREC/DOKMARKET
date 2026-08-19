import { createLocalId, readLocal, removeLocal, writeLocal } from "./localStorageService";

const USERS_KEY = "users";
const CREDENTIALS_KEY = "credentials";
const SESSION_KEY = "session";
const ORGANIZATIONS_KEY = "organizations";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const EARLY_LAUNCH_LIMIT = 1000;
const ALLOWED_ROLES = new Set(["user", "lawyer"]);

// Local prototype only: credentials stored in localStorage are not secure.
// Production authentication must use a backend, password hashing and secure HttpOnly sessions.

export function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function listUsers() {
  return readLocal(USERS_KEY, []);
}

export function getEarlyLaunchStats() {
  const earlyLaunchUsers = listUsers().filter(user => user.role === "user" && user.earlyLaunch === true);
  const used = Math.min(EARLY_LAUNCH_LIMIT, earlyLaunchUsers.length);
  return { total: EARLY_LAUNCH_LIMIT, used, remaining: EARLY_LAUNCH_LIMIT - used };
}

function createSession(userId) {
  const createdAt = new Date();
  const session = {
    userId,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + SESSION_TTL_MS).toISOString(),
  };
  if (writeLocal(SESSION_KEY, session) === null) throw new Error("SESSION_SAVE_FAILED");
  return session;
}

function validateRegistration(data) {
  const emailNormalized = normalizeEmail(data.email);
  if (!data.fullName?.trim() || !emailNormalized || !data.password) throw new Error("REQUIRED_FIELDS");
  if (listUsers().some(user => user.emailNormalized === emailNormalized)) throw new Error("EMAIL_EXISTS");
  return emailNormalized;
}

function register(data, role, organizationId = null, forcedId = null) {
  if (!ALLOWED_ROLES.has(role)) throw new Error("INVALID_ROLE");
  const emailNormalized = validateRegistration(data);
  const registeredUsers = listUsers();
  const registeredAt = new Date();
  const now = registeredAt.toISOString();
  const lawyerNumber = role === "lawyer"
    ? registeredUsers.filter(item => item.role === "lawyer").length + 1
    : null;
  const lawyerFounder = lawyerNumber !== null && lawyerNumber <= 50;
  const trialDays = lawyerFounder ? 60 : 30;
  const lawyerPlan = role === "lawyer" ? {
    plan: "START",
    planName: "START",
    trialActive: true,
    trialStartedAt: now,
    trialEndsAt: new Date(registeredAt.getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
    trialDays,
    documentsLimit: 30,
    clientsLimit: 30,
    whiteLabel: false,
    teamMembersLimit: 1,
    bulkGeneration: false,
    ...(lawyerFounder ? {
      lawyerFounder: true,
      lawyerFounderNumber: lawyerNumber,
      founderBadge: "Юрист раннего доступа",
      founderDiscountPercent: 50,
      founderDiscountMonths: lawyerNumber <= 10 ? 12 : 6,
      ...(lawyerNumber <= 10 ? { founderPriority: true } : {}),
    } : {}),
  } : {};
  const earlyLaunchUsers = role === "user"
    ? registeredUsers.filter(item => item.role === "user" && item.earlyLaunch === true)
    : [];
  const earlyLaunchAvailable = role === "user" && !forcedId && earlyLaunchUsers.length < EARLY_LAUNCH_LIMIT;
  const earlyLaunchPlan = role === "user" ? {
    earlyLaunch: earlyLaunchAvailable,
    freeClaimsLimit: earlyLaunchAvailable ? 1 : 0,
    freeClaimsUsed: 0,
    ...(earlyLaunchAvailable ? {
      earlyLaunchNumber: Math.max(0, ...earlyLaunchUsers.map(item => Number(item.earlyLaunchNumber) || 0)) + 1,
      earlyLaunchStartedAt: now,
    } : {}),
  } : {};
  const user = {
    id: forcedId || createLocalId("user"),
    role,
    email: String(data.email).trim(),
    emailNormalized,
    fullName: data.fullName.trim(),
    full_name: data.fullName.trim(),
    phone: String(data.phone || "").trim(),
    status: "active",
    organizationId,
    createdAt: now,
    updatedAt: now,
    ...lawyerPlan,
    ...earlyLaunchPlan,
  };
  if (writeLocal(USERS_KEY, [...registeredUsers, user]) === null) throw new Error("USER_SAVE_FAILED");
  const credentials = readLocal(CREDENTIALS_KEY, []);
  if (writeLocal(CREDENTIALS_KEY, [...credentials, { userId: user.id, password: String(data.password) }]) === null) {
    throw new Error("CREDENTIALS_SAVE_FAILED");
  }
  createSession(user.id);
  return user;
}

export function getCurrentUser() {
  const session = readLocal(SESSION_KEY, null);
  if (!session?.userId || !session.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) {
    if (session) removeLocal(SESSION_KEY);
    return null;
  }
  const user = listUsers().find(item => item.id === session.userId && item.status === "active") || null;
  if (!user) removeLocal(SESSION_KEY);
  return user;
}

export function login(email, password) {
  const emailNormalized = normalizeEmail(email);
  const user = listUsers().find(item => item.emailNormalized === emailNormalized && item.status === "active");
  const credential = user && readLocal(CREDENTIALS_KEY, []).find(item => item.userId === user.id);
  if (!user || !credential || credential.password !== String(password)) throw new Error("INVALID_CREDENTIALS");
  createSession(user.id);
  return user;
}

export function registerUser(data) {
  return register(data, "user", null);
}

export function registerLawyer(data) {
  const emailNormalized = validateRegistration(data);
  if (!data.organizationName?.trim()) throw new Error("ORGANIZATION_REQUIRED");
  const organizationId = createLocalId("organization");
  const user = register({ ...data, email: emailNormalized }, "lawyer", organizationId);
  const organizations = readLocal(ORGANIZATIONS_KEY, []);
  const organization = {
    id: organizationId,
    ownerUserId: user.id,
    name: data.organizationName.trim(),
    inn: String(data.inn || "").trim(),
    status: "active",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  if (writeLocal(ORGANIZATIONS_KEY, [...organizations, organization]) === null) throw new Error("ORGANIZATION_SAVE_FAILED");
  return user;
}

export function updateCurrentUser(updates) {
  const current = getCurrentUser();
  if (!current) throw new Error("AUTH_REQUIRED");
  const forbidden = new Set(["id", "role", "status", "organizationId", "createdAt", "emailNormalized"]);
  const safeUpdates = Object.fromEntries(Object.entries(updates || {}).filter(([key]) => !forbidden.has(key)));
  if (safeUpdates.email) {
    const normalized = normalizeEmail(safeUpdates.email);
    if (listUsers().some(user => user.id !== current.id && user.emailNormalized === normalized)) throw new Error("EMAIL_EXISTS");
    safeUpdates.emailNormalized = normalized;
  }
  if (safeUpdates.fullName) safeUpdates.full_name = safeUpdates.fullName;
  const updated = { ...current, ...safeUpdates, updatedAt: new Date().toISOString() };
  if (writeLocal(USERS_KEY, listUsers().map(user => user.id === current.id ? updated : user)) === null) throw new Error("USER_SAVE_FAILED");
  return updated;
}

export function logout() {
  removeLocal(SESSION_KEY);
  return null;
}

export function loginAsDemo(role = "user") {
  if (!import.meta.env.DEV) throw new Error("DEMO_LOGIN_DISABLED");
  const safeRole = ALLOWED_ROLES.has(role) ? role : "user";
  const email = safeRole === "lawyer" ? "lawyer@dosudebka.local" : "demo@dosudebka.local";
  let user = listUsers().find(item => item.emailNormalized === email);
  if (!user) {
    const data = { fullName: safeRole === "lawyer" ? "Демо юрист" : "Демо пользователь", email, phone: "", password: "demo", organizationName: "Демо юридический кабинет" };
    if (safeRole === "lawyer") {
      const organizationId = "demo-organization";
      user = register(data, "lawyer", organizationId, "demo-lawyer");
      const organizations = readLocal(ORGANIZATIONS_KEY, []);
      if (!organizations.some(item => item.id === organizationId)) writeLocal(ORGANIZATIONS_KEY, [...organizations, { id: organizationId, ownerUserId: user.id, name: data.organizationName, inn: "", status: "active", createdAt: user.createdAt, updatedAt: user.updatedAt }]);
    } else {
      user = register(data, "user", null, "demo-user");
    }
  } else {
    createSession(user.id);
  }
  return user;
}
