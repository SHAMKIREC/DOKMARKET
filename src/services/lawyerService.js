import { createLocalId, readLocal, writeLocal } from "./localStorageService";
import { getCurrentUser } from "./authService";
import { listDocuments } from "./documentService";

const PLAN_KEY = "lawyer-plan";
const CHECK_KEY = "check-requests";
const BUSINESS_LEADS_KEY = "business-leads";
const CLIENTS_KEY = "lawyer-clients";
const BRAND_SETTINGS_KEY = "business-brand-settings";
const PLAN_LIMITS = {
  START: { documentsLimit: 30, clientsLimit: 30 },
  BUSINESS: { documentsLimit: 150, clientsLimit: 150 },
  UNLIMITED: { documentsLimit: 500 },
};

const defaultPlan = () => ({
  id: "demo-lawyer-plan",
  created_by_id: getCurrentUser()?.id || null,
  plan: "START",
  generations_this_month: 0,
  generation_month: new Date().toISOString().slice(0, 7),
  custom_prices: { single: 0, collective: 0 },
});

export function getLawyerPlan() {
  let plan = readLocal(PLAN_KEY, defaultPlan());
  const user = getCurrentUser();
  if (user?.role === "lawyer") {
    const planName = String(user.plan || plan.plan || "START").toUpperCase();
    const planLimits = PLAN_LIMITS[planName] || PLAN_LIMITS.START;
    plan = {
      ...plan,
      plan: planName,
      planName: user.planName || user.plan || plan.plan,
      trialActive: user.trialActive ?? false,
      trialStartedAt: user.trialStartedAt,
      trialEndsAt: user.trialEndsAt,
      trialDays: user.trialDays,
      documentsLimit: planLimits.documentsLimit,
      clientsLimit: planLimits.clientsLimit ?? user.clientsLimit ?? plan.clientsLimit,
      whiteLabel: user.whiteLabel ?? false,
      teamMembersLimit: user.teamMembersLimit ?? 1,
      bulkGeneration: user.bulkGeneration ?? false,
      lawyerFounder: user.lawyerFounder ?? false,
      lawyerFounderNumber: user.lawyerFounderNumber,
      founderBadge: user.founderBadge,
      founderDiscountPercent: user.founderDiscountPercent,
      founderDiscountMonths: user.founderDiscountMonths,
      founderPriority: user.founderPriority ?? false,
    };
  }
  const month = new Date().toISOString().slice(0, 7);
  if (plan.generation_month !== month) {
    plan = { ...plan, generations_this_month: 0, generation_month: month };
    writeLocal(PLAN_KEY, plan);
  }
  return plan;
}

export function updateLawyerPlan(updates) {
  const plan = { ...getLawyerPlan(), ...updates };
  if (writeLocal(PLAN_KEY, plan) === null) throw new Error("LAWYER_PLAN_SAVE_FAILED");
  return plan;
}

export function getLawyerDashboard() {
  const user = getCurrentUser();
  const documents = user ? listDocuments({ userId: user.id }) : [];
  return { user, plan: getLawyerPlan(), documents, checkRequests: readLocal(CHECK_KEY, []) };
}

export function listCheckRequests() {
  return readLocal(CHECK_KEY, []);
}

export function saveCheckRequests(requests) {
  return writeLocal(CHECK_KEY, requests);
}

export function createCheckRequest(data = {}) {
  const user = getCurrentUser();
  const request = {
    id: createLocalId("check"),
    user_id: user.id,
    status: "new",
    created_date: new Date().toISOString(),
    ...data,
  };
  if (saveCheckRequests([...listCheckRequests(), request]) === null) {
    throw new Error("CHECK_REQUEST_SAVE_FAILED");
  }
  return request;
}

export function listBusinessLeads() {
  return readLocal(BUSINESS_LEADS_KEY, []);
}

export function createBusinessLead(plan) {
  const user = getCurrentUser();
  const lead = {
    id: createLocalId("business-lead"),
    user_id: user.id,
    plan,
    status: "new",
    created_date: new Date().toISOString(),
  };
  if (writeLocal(BUSINESS_LEADS_KEY, [...listBusinessLeads(), lead]) === null) {
    throw new Error("BUSINESS_LEAD_SAVE_FAILED");
  }
  return lead;
}

export function listLawyerClients() {
  return readLocal(CLIENTS_KEY, []);
}

export function saveLawyerClients(clients) {
  if (writeLocal(CLIENTS_KEY, clients) === null) throw new Error("CLIENTS_SAVE_FAILED");
  return clients;
}

export function updateCheckRequest(id, updates) {
  const requests = listCheckRequests().map(request => request.id === id ? { ...request, ...updates, updated_date: new Date().toISOString() } : request);
  if (saveCheckRequests(requests) === null) throw new Error("CHECK_REQUEST_UPDATE_FAILED");
  return requests.find(request => request.id === id) || null;
}

export function getBrandSettings() {
  return readLocal(BRAND_SETTINGS_KEY, {
    cabinet_name: "Юридический кабинет",
    logo_url: "",
    primary_color: "#0ea5e9",
    description: "Подготовка досудебных претензий и сопровождение клиентов",
    client_prices: "",
  });
}

export function saveBrandSettings(settings) {
  if (writeLocal(BRAND_SETTINGS_KEY, settings) === null) throw new Error("BRAND_SETTINGS_SAVE_FAILED");
  return settings;
}
