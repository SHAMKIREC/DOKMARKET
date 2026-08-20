import {
  clearSession,
  ensureSession,
  getOwnProfile,
  getStoredSession,
  signInWithPassword,
  signOut,
  signUp,
  updateOwnProfile,
} from "@/lib/supabaseRest";

const USER_CACHE_KEY = "dokmarket:user-cache";
const EARLY_LAUNCH_LIMIT = 1000;
const ALLOWED_ROLES = new Set(["user", "lawyer"]);

export function normalizeEmail(email = "") { return String(email).trim().toLowerCase(); }
function readUserCache(){try{return JSON.parse(localStorage.getItem(USER_CACHE_KEY)||"null")}catch{return null}}
function saveUserCache(user){if(!user){localStorage.removeItem(USER_CACHE_KEY);return null}localStorage.setItem(USER_CACHE_KEY,JSON.stringify(user));return user}
function defaultPlan(role){return role==="lawyer"?{plan:"SELLER",planName:"SELLER",trialActive:false}:{earlyLaunch:true,freeClaimsLimit:1,freeClaimsUsed:0}}
function normalizeUser(authUser,profile){if(!authUser?.id)return null;const role=ALLOWED_ROLES.has(profile?.role)?profile.role:"user";const planData=profile?.plan_data&&typeof profile.plan_data==="object"?profile.plan_data:{};const fullName=profile?.full_name||authUser.user_metadata?.full_name||"";return{id:authUser.id,role,email:authUser.email||"",emailNormalized:normalizeEmail(authUser.email||""),fullName,full_name:fullName,phone:profile?.phone||authUser.user_metadata?.phone||"",organizationName:profile?.organization_name||authUser.user_metadata?.organization_name||"",inn:profile?.inn||authUser.user_metadata?.inn||"",status:"active",createdAt:authUser.created_at||profile?.created_at||new Date().toISOString(),updatedAt:profile?.updated_at||authUser.updated_at||new Date().toISOString(),...defaultPlan(role),...planData}}
export function getCurrentUser(){const session=getStoredSession();if(!session?.access_token){saveUserCache(null);return null}return readUserCache()}
export async function loadCurrentUser(){const session=await ensureSession();if(!session?.access_token||!session.user?.id){saveUserCache(null);return null}try{const profile=await getOwnProfile(session.user.id);return saveUserCache(normalizeUser(session.user,profile))}catch{clearSession();saveUserCache(null);return null}}
export function getEarlyLaunchStats(){const cached=readUserCache();const used=cached?.earlyLaunchNumber?Math.min(EARLY_LAUNCH_LIMIT,Number(cached.earlyLaunchNumber)||0):0;return{total:EARLY_LAUNCH_LIMIT,used,remaining:EARLY_LAUNCH_LIMIT-used}}
export async function login(email,password){try{const session=await signInWithPassword(normalizeEmail(email),String(password));const profile=await getOwnProfile(session.user.id);return saveUserCache(normalizeUser(session.user,profile))}catch(error){if(error?.status===400||/invalid login|credentials/i.test(String(error?.message)))throw new Error("INVALID_CREDENTIALS");throw error}}
async function register(data,role){
 if(!ALLOWED_ROLES.has(role))throw new Error("INVALID_ROLE");
 const email=normalizeEmail(data.email);if(!data.fullName?.trim()||!email||!data.password)throw new Error("REQUIRED_FIELDS");
 const planData=defaultPlan(role);let result;
 try{result=await signUp(email,String(data.password),{role,full_name:data.fullName.trim(),phone:String(data.phone||"").trim(),organization_name:role==="lawyer"?String(data.organizationName||"").trim():"",inn:role==="lawyer"?String(data.inn||"").trim():"",plan_data:planData})}catch(error){if(/already registered|already been registered|user already/i.test(String(error?.message)))throw new Error("EMAIL_EXISTS");throw error}
 if(!result?.access_token||!result?.user?.id){const confirmationError=new Error("EMAIL_CONFIRMATION_REQUIRED");confirmationError.email=email;throw confirmationError}
 const profile=await getOwnProfile(result.user.id);return saveUserCache(normalizeUser(result.user,profile));
}
export function registerUser(data){return register(data,"user")}
export function registerLawyer(data){return register(data,"lawyer")}
export async function updateCurrentUser(updates){const session=await ensureSession();if(!session?.user?.id)throw new Error("AUTH_REQUIRED");const allowed={};if(updates.fullName!==undefined)allowed.full_name=String(updates.fullName).trim();if(updates.full_name!==undefined)allowed.full_name=String(updates.full_name).trim();if(updates.phone!==undefined)allowed.phone=String(updates.phone).trim();if(updates.organizationName!==undefined)allowed.organization_name=String(updates.organizationName).trim();if(updates.inn!==undefined)allowed.inn=String(updates.inn).trim();if(updates.planData&&typeof updates.planData==="object")allowed.plan_data=updates.planData;const profile=await updateOwnProfile(session.user.id,allowed);return saveUserCache(normalizeUser(session.user,profile))}
export async function logout(){await signOut();saveUserCache(null);return null}
export function loginAsDemo(){throw new Error("DEMO_LOGIN_DISABLED")}
