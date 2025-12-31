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

  if (raw.mode === "hybrid") {
    const lumpsumEveryYears = clampNumber(Math.round(raw.lumpsumEveryYears), 1, 10);
    const start = clampNumber(Math.round(raw.lumpsumStartYear), 1, years);
    const end = clampNumber(Math.round(raw.lumpsumEndYear), start, years);

    return {
      mode: "hybrid",
      monthlyInvestment: clampNumber(raw.monthlyInvestment, 0, 10_000_000),
      stepUpEnabled: !!raw.stepUpEnabled,
      annualStepUpPercent: clampNumber(raw.annualStepUpPercent, 0, 100),
      lumpsumAmount: clampNumber(raw.lumpsumAmount, 0, 1_000_000_000),
      lumpsumEveryYears,
      lumpsumStartYear: start,
      lumpsumEndYear: end,
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
  // - Lumpsum deposits (one-time or periodic) are deposited at the beginning
  //   of the first month of the deposit year.
  const months = normalized.years * 12;

  const sipMonthlyForMonth = (monthIndex0: number): number => {
    const yearIndex0 = Math.floor(monthIndex0 / 12);

    if (normalized.mode === "lumpsum") return 0;
    if (normalized.mode === "sip") return normalized.monthlyInvestment;
    if (normalized.mode === "stepup") {
      const step = normalized.annualStepUpPercent / 100;
      return normalized.monthlyInvestment * Math.pow(1 + step, yearIndex0);
    }

    // hybrid
    if (!normalized.stepUpEnabled) return normalized.monthlyInvestment;
    const step = normalized.annualStepUpPercent / 100;
    return normalized.monthlyInvestment * Math.pow(1 + step, yearIndex0);
  };

  const lumpsumForMonth = (monthIndex0: number): number => {
    const isStartOfYear = monthIndex0 % 12 === 0;
    if (!isStartOfYear) return 0;

    const year = monthIndex0 / 12 + 1; // 1-based year

    if (normalized.mode === "lumpsum") {
      return year === 1 ? normalized.lumpsumInvestment : 0;
    }

    if (normalized.mode !== "hybrid") return 0;

    if (year < normalized.lumpsumStartYear || year > normalized.lumpsumEndYear) return 0;
    const offset = year - normalized.lumpsumStartYear;
    if (offset % normalized.lumpsumEveryYears !== 0) return 0;
    return normalized.lumpsumAmount;
  };

  let investedThisYear = 0;
  let lumpsumThisYear = 0;

  for (let m = 0; m < months; m++) {
    const sipContribution = sipMonthlyForMonth(m);
    const lumpContribution = lumpsumForMonth(m);

    const totalContribution = sipContribution + lumpContribution;
    if (totalContribution > 0) {
      investedTotal += totalContribution;
      investedThisYear += totalContribution;
      value += totalContribution;
    }

    if (lumpContribution > 0) {
      lumpsumThisYear += lumpContribution;
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
      } else if (normalized.mode === "stepup") {
        const step = normalized.annualStepUpPercent / 100;
        row.sipMonthlyForYear = normalized.monthlyInvestment * Math.pow(1 + step, year - 1);
      } else if (normalized.mode === "hybrid") {
        row.lumpsumThisYear = lumpsumThisYear;
        if (normalized.stepUpEnabled) {
          const step = normalized.annualStepUpPercent / 100;
          row.sipMonthlyForYear = normalized.monthlyInvestment * Math.pow(1 + step, year - 1);
        } else {
          row.sipMonthlyForYear = normalized.monthlyInvestment;
        }
      }

      schedule.push(row);

      investedThisYear = 0;
      lumpsumThisYear = 0;
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
    case "hybrid":
      return "SIP + Lumpsum";
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
