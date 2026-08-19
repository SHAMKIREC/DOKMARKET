import {
  DOCUMENT_MODEL_SCHEMA_VERSION,
  LABOR_SOLO_TEMPLATE_VERSION,
  SUPPORTED_LABOR_SOLO_SUBTYPES,
} from "../constants.js";
import { mapLaborFacts } from "../categories/labor/mapLaborFacts.js";
import { resolveLaborDemands } from "../categories/labor/resolveLaborDemands.js";
import { resolveLaborLegalGrounds } from "../categories/labor/resolveLaborLegalGrounds.js";
import { mapClaimant } from "../mappers/mapClaimant.js";
import { mapEvidence } from "../mappers/mapEvidence.js";
import { mapRespondent } from "../mappers/mapRespondent.js";
import { safeString } from "../normalization/index.js";

export function buildSoloDocumentModel(claimData, options = {}) {
  const facts = mapLaborFacts(claimData);
  const subtype = safeString(claimData.subtype) || "salary-debt";
  return {
    schemaVersion: DOCUMENT_MODEL_SCHEMA_VERSION,
    documentType: "pretrial-claim",
    category: "labor",
    subtype,
    templateVersion: LABOR_SOLO_TEMPLATE_VERSION,
    generatedAt: options.generatedAt || new Date().toISOString(),
    locale: "ru-RU",
    claimant: mapClaimant(claimData.workers?.[0]),
    respondent: mapRespondent(claimData.employer || claimData.respondent || {}),
    facts,
    legalGrounds: resolveLaborLegalGrounds(),
    demands: resolveLaborDemands(facts.debt.outstandingAmount),
    evidence: mapEvidence(claimData),
    participants: [],
    deadlines: {
      responseTerm: {
        amount: 10,
        unit: "calendar-days",
        startsFrom: "receipt-date",
        legalBasis: "Требование заявителя",
      },
      sentAt: "",
      responseDueAt: "",
    },
    metadata: {
      source: options.source || "generator",
      sourceClaimId: safeString(options.sourceClaimId),
      roomId: "",
      sourceSchema: "claimData-v2",
      sourceSnapshotHash: safeString(options.sourceSnapshotHash),
      renderer: "docxtemplater",
      rendererVersion: safeString(options.rendererVersion),
    },
  };
}

export function isSupportedSoloClaim(claimData = {}) {
  const category = safeString(claimData.type || claimData.category);
  const mode = safeString(claimData.mode) || "individual";
  const subtype = safeString(claimData.subtype);
  return category === "labor"
    && mode === "individual"
    && SUPPORTED_LABOR_SOLO_SUBTYPES.has(subtype);
}
