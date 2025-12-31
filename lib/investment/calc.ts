import type { InvestmentInputs, InvestmentResult, InvestmentMode, YearlyRow } from "@/lib/investment/types";

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function effectiveMonthlyRateFromAnnualPercent(annualPercent: number): number {
  const annual = annualPercent / 100;
  if (!Number.isFinite(annual) || annual <= -1) return 0;
  return Math.pow(1 + annual, 1 / 12) - 1;
}

export function normalizeInputs(raw: InvestmentInputs): InvestmentInputs {
  const years = clampNumber(Math.round(raw.years), 1, 60);

  if (raw.mode === "lumpsum") {
    return {
      mode: "lumpsum",
      lumpsumInvestment: clampNumber(raw.lumpsumInvestment, 0, 1_000_000_000),
      annualReturnRate: clampNumber(raw.annualReturnRate, -100, 100),
      years,
    };
  }

  if (raw.mode === "stepup") {
    return {
      mode: "stepup",
      monthlyInvestment: clampNumber(raw.monthlyInvestment, 0, 10_000_000),
      annualStepUpPercent: clampNumber(raw.annualStepUpPercent, 0, 100),
      annualReturnRate: clampNumber(raw.annualReturnRate, -100, 100),
      years,
    };
  }

  return {
    mode: "sip",
    monthlyInvestment: clampNumber(raw.monthlyInvestment, 0, 10_000_000),
    annualReturnRate: clampNumber(raw.annualReturnRate, -100, 100),
    years,
  };
}

export function calculateInvestment(inputs: InvestmentInputs): InvestmentResult {
  const normalized = normalizeInputs(inputs);
  const monthlyRate = effectiveMonthlyRateFromAnnualPercent(normalized.annualReturnRate);

  const schedule: YearlyRow[] = [];

  let value = 0;
  let investedTotal = 0;

  // Assumptions:
  // - SIP contributions are deposited at the beginning of each month.
  // - Lumpsum is deposited at time 0 (start), then compounds monthly.
  const months = normalized.years * 12;

  const sipMonthlyForMonth = (monthIndex0: number): number => {
    if (normalized.mode === "lumpsum") return 0;
    if (normalized.mode === "sip") return normalized.monthlyInvestment;

    const yearIndex0 = Math.floor(monthIndex0 / 12);
    const step = normalized.annualStepUpPercent / 100;
    return normalized.monthlyInvestment * Math.pow(1 + step, yearIndex0);
  };

  // Initial lumpsum deposit
  if (normalized.mode === "lumpsum") {
    value = normalized.lumpsumInvestment;
    investedTotal = normalized.lumpsumInvestment;
  }

  let investedThisYear = 0;
  let yearStartValue = value;

  for (let m = 0; m < months; m++) {
    const contribution = sipMonthlyForMonth(m);

    if (contribution > 0) {
      investedTotal += contribution;
      investedThisYear += contribution;
      value += contribution;
    }

    value *= 1 + monthlyRate;

    const isYearEnd = (m + 1) % 12 === 0;
    if (isYearEnd) {
      const year = (m + 1) / 12;
      const gainsTotal = value - investedTotal;

      const row: YearlyRow = {
        year,
        investedThisYear,
        investedTotal,
        endValue: value,
        gainsTotal,
      };

      if (normalized.mode === "sip") {
        row.sipMonthlyForYear = normalized.monthlyInvestment;
      }

      if (normalized.mode === "stepup") {
        const step = normalized.annualStepUpPercent / 100;
        row.sipMonthlyForYear = normalized.monthlyInvestment * Math.pow(1 + step, year - 1);
      }

      schedule.push(row);

      // reset for next year
      investedThisYear = 0;
      yearStartValue = value;
      void yearStartValue;
    }
  }

  const maturityValue = value;
  const estimatedReturns = maturityValue - investedTotal;

  return {
    inputs: normalized,
    totalInvested: investedTotal,
    maturityValue,
    estimatedReturns,
    monthlyRate,
    schedule,
  };
}

export function modeLabel(mode: InvestmentMode): string {
  switch (mode) {
    case "sip":
      return "SIP";
    case "stepup":
      return "Step-up SIP";
    case "lumpsum":
      return "Lumpsum";
  }
}

export function formatINR(value: number): string {
  const safe = toFiniteNumber(value) ?? 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(safe));
}
