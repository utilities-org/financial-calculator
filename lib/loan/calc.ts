import type {
  HomeLoanInputs,
  HomeLoanMode,
  HomeLoanMonthRow,
  HomeLoanResult,
  HomeLoanYearRow,
} from "@/lib/loan/types";
import { effectiveMonthlyRateFromAnnualPercent } from "@/lib/investment/calc";

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeInputs(raw: HomeLoanInputs): HomeLoanInputs {
  const years = clampNumber(Math.round(raw.years), 1, 50);
  const principal = clampNumber(raw.principal, 0, 1_000_000_000);
  const annualInterestRate = clampNumber(raw.annualInterestRate, 0, 50);

  if (raw.mode === "neutralize") {
    return {
      mode: "neutralize",
      principal,
      annualInterestRate,
      years,
      mfMonthlyInvestment: clampNumber(raw.mfMonthlyInvestment, 0, 10_000_000),
      mfAnnualReturnRate: clampNumber(raw.mfAnnualReturnRate, -100, 50),
    };
  }

  return {
    mode: "emi",
    principal,
    annualInterestRate,
    years,
  };
}

export function modeLabel(mode: HomeLoanMode): string {
  switch (mode) {
    case "emi":
      return "Home Loan EMI";
    case "neutralize":
      return "EMI + MF neutralizer";
  }
}

export function loanMonthlyRateFromAnnualPercent(annualPercent: number): number {
  const annual = annualPercent / 100;
  if (!Number.isFinite(annual) || annual < 0) return 0;
  // Typical home loans quote a nominal annual rate; EMI uses monthly = annual/12.
  return annual / 12;
}

export function calculateEmi(principal: number, monthlyRate: number, months: number): number {
  if (!Number.isFinite(principal) || principal <= 0) return 0;
  if (!Number.isFinite(months) || months <= 0) return 0;
  if (!Number.isFinite(monthlyRate) || monthlyRate <= 0) {
    return principal / months;
  }

  const pow = Math.pow(1 + monthlyRate, months);
  const emi = (principal * monthlyRate * pow) / (pow - 1);
  return Number.isFinite(emi) ? emi : 0;
}

function requiredPaymentForTargetFutureValue(target: number, monthlyRate: number, months: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  if (!Number.isFinite(months) || months <= 0) return 0;
  if (!Number.isFinite(monthlyRate) || monthlyRate === 0) return target / months;

  const pow = Math.pow(1 + monthlyRate, months);
  const factor = ((pow - 1) / monthlyRate) * (1 + monthlyRate);
  if (!Number.isFinite(factor) || factor <= 0) return 0;
  return target / factor;
}

export function calculateHomeLoan(inputs: HomeLoanInputs): HomeLoanResult {
  const normalized = normalizeInputs(inputs);

  const months = normalized.years * 12;
  const monthlyRateLoan = loanMonthlyRateFromAnnualPercent(normalized.annualInterestRate);
  const emi = calculateEmi(normalized.principal, monthlyRateLoan, months);

  const schedule: HomeLoanYearRow[] = [];
  const monthlySchedule: HomeLoanMonthRow[] = [];

  let balance = normalized.principal;
  let cumulativePrincipalPaid = 0;
  let cumulativeInterestPaid = 0;
  let cumulativeTotalPaid = 0;

  let mfMonthlyRate: number | undefined;
  let mfValue = 0;
  let mfInvestedTotal = 0;

  if (normalized.mode === "neutralize") {
    mfMonthlyRate = effectiveMonthlyRateFromAnnualPercent(normalized.mfAnnualReturnRate);
  }

  for (let monthIndex0 = 0; monthIndex0 < months; monthIndex0++) {
    const openingBalance = balance;

    const interest = openingBalance * monthlyRateLoan;
    let principalPaid = emi - interest;

    // Handle 0% interest (or very small) cases.
    if (!Number.isFinite(principalPaid)) principalPaid = 0;

    if (principalPaid > balance) {
      principalPaid = balance;
    }

    const totalPaid = principalPaid + interest;

    balance = openingBalance - principalPaid;

    cumulativePrincipalPaid += principalPaid;
    cumulativeInterestPaid += interest;
    cumulativeTotalPaid += totalPaid;

    if (normalized.mode === "neutralize") {
      const sip = normalized.mfMonthlyInvestment;
      if (sip > 0) {
        mfInvestedTotal += sip;
        mfValue += sip;
      }
      mfValue *= 1 + (mfMonthlyRate ?? 0);
    }

    const month = monthIndex0 + 1;
    const year = Math.floor(monthIndex0 / 12) + 1;
    const monthOfYear = (monthIndex0 % 12) + 1;

    const monthRow: HomeLoanMonthRow = {
      month,
      year,
      monthOfYear,
      openingBalance,
      emi,
      principalPaid,
      interestPaid: interest,
      closingBalance: balance,
      cumulativePrincipalPaid,
      cumulativeInterestPaid,
      cumulativeTotalPaid,
    };

    if (normalized.mode === "neutralize") {
      monthRow.mfInvestedTotal = mfInvestedTotal;
      monthRow.mfValue = mfValue;
      monthRow.mfGains = mfValue - mfInvestedTotal;
    }

    monthlySchedule.push(monthRow);

    const isYearEnd = (monthIndex0 + 1) % 12 === 0;
    if (isYearEnd) {
      const year = (monthIndex0 + 1) / 12;

      const start = (year - 1) * 12;
      const end = year * 12;
      const monthsForYear = monthlySchedule.slice(start, end);

      const yearOpeningBalance = monthsForYear[0]?.openingBalance ?? normalized.principal;
      const yearClosingBalance = monthsForYear[monthsForYear.length - 1]?.closingBalance ?? balance;

      const principalPaidYear = monthsForYear.reduce((sum, r) => sum + r.principalPaid, 0);
      const interestPaidYear = monthsForYear.reduce((sum, r) => sum + r.interestPaid, 0);
      const totalPaidYear = monthsForYear.reduce((sum, r) => sum + r.emi, 0);

      const row: HomeLoanYearRow = {
        year,
        openingBalance: yearOpeningBalance,
        principalPaidYear,
        interestPaidYear,
        totalPaidYear,
        closingBalance: yearClosingBalance,
        cumulativePrincipalPaid,
        cumulativeInterestPaid,
        cumulativeTotalPaid,
      };

      if (normalized.mode === "neutralize") {
        row.mfInvestedTotal = mfInvestedTotal;
        row.mfValue = mfValue;
        row.mfGains = mfValue - mfInvestedTotal;
      }

      schedule.push(row);
    }
  }

  const totalPayment = cumulativeTotalPaid;
  const totalInterest = cumulativeInterestPaid;

  const result: HomeLoanResult = {
    inputs: normalized,
    months,
    monthlyRateLoan,
    emi,
    totalInterest,
    totalPayment,
    schedule,
    monthlySchedule,
  };

  if (normalized.mode === "neutralize") {
    const r = mfMonthlyRate ?? 0;
    const maturity = mfValue;
    const invested = mfInvestedTotal;

    result.mfMonthlyRate = r;
    result.mfMaturityValue = maturity;
    result.mfTotalInvested = invested;
    result.mfEstimatedGains = maturity - invested;
    result.mfRequiredMonthlyInvestmentToMatchInterest = requiredPaymentForTargetFutureValue(
      totalInterest,
      r,
      months
    );
    result.mfAmountLeftAfterInterest = maturity - totalInterest;
  }

  return result;
}
