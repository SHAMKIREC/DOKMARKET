import {
  normalizeAddress,
  normalizeAmount,
  normalizeDate,
  safeString,
} from "../../normalization/index.js";

export function mapLaborFacts(claimData = {}) {
  const circumstances = claimData.circumstances || {};
  const worker = claimData.workers?.[0] || {};
  const originalAmount = normalizeAmount(circumstances.debtAmount);
  const partialPaymentAmount = normalizeAmount(circumstances.partialPaymentAmount);
  const explicitOutstanding = normalizeAmount(
    circumstances.outstandingDebtAmount || circumstances.remainingDebtAmount,
  );
  const outstandingAmount = explicitOutstanding || Math.max(0, originalAmount - partialPaymentAmount);

  return {
    employment: {
      position: safeString(worker.position || circumstances.position),
      workStartDate: normalizeDate(circumstances.workStart || circumstances.workStartDate),
      workEndDate: normalizeDate(circumstances.workEnd || circumstances.workEndDate),
      stillWorking: circumstances.stillWorking === true || circumstances.workEnd === "настоящее время",
      workplaceAddress: normalizeAddress(circumstances.workplace || circumstances.workplaceAddress),
      supervisor: safeString(circumstances.supervisor),
      paymentForm: Array.isArray(circumstances.paymentForm)
        ? circumstances.paymentForm.map(safeString).filter(Boolean)
        : safeString(circumstances.paymentForm) ? [safeString(circumstances.paymentForm)] : [],
    },
    violation: {
      description: safeString(circumstances.description),
      dueDate: normalizeDate(circumstances.dueDate),
      delayDays: Number.isFinite(Number(circumstances.delayDays)) ? Number(circumstances.delayDays) : 0,
    },
    debt: {
      originalAmount,
      partialPaymentAmount,
      outstandingAmount,
      lastPartialPaymentDate: normalizeDate(circumstances.lastPartialPaymentDate),
      partialPaymentsDescription: safeString(circumstances.partialPayments),
    },
    additional: {
      socialImpact: safeString(circumstances.socialImpact),
      userComment: safeString(circumstances.userComment),
    },
  };
}
