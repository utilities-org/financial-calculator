import type { InvestmentInputs, InvestmentMode } from "@/lib/investment/types";

const DEFAULTS = {
  mode: "sip" as InvestmentMode,
  monthlyInvestment: 5000,
  annualStepUpPercent: 10,
  lumpsumInvestment: 100000,
  annualReturnRate: 12,
  years: 10,
};

function getFirst(searchParams: URLSearchParams, key: string): string | null {
  const value = searchParams.get(key);
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseNumber(searchParams: URLSearchParams, key: string): number | null {
  const raw = getFirst(searchParams, key);
  if (raw === null) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function parseMode(searchParams: URLSearchParams): InvestmentMode {
  const m = (getFirst(searchParams, "mode") ?? "").toLowerCase();
  if (m === "sip" || m === "stepup" || m === "lumpsum") return m;
  return DEFAULTS.mode;
}

export function inputsFromSearchParams(searchParams: URLSearchParams): InvestmentInputs {
  const mode = parseMode(searchParams);

  const annualReturnRate =
    parseNumber(searchParams, "rate") ??
    parseNumber(searchParams, "r") ??
    DEFAULTS.annualReturnRate;

  const years =
    parseNumber(searchParams, "years") ??
    parseNumber(searchParams, "y") ??
    DEFAULTS.years;

  if (mode === "lumpsum") {
    const lumpsumInvestment =
      parseNumber(searchParams, "amt") ??
      parseNumber(searchParams, "l") ??
      DEFAULTS.lumpsumInvestment;

    return {
      mode: "lumpsum",
      lumpsumInvestment,
      annualReturnRate,
      years,
    };
  }

  const monthlyInvestment =
    parseNumber(searchParams, "amt") ??
    parseNumber(searchParams, "m") ??
    DEFAULTS.monthlyInvestment;

  if (mode === "stepup") {
    const annualStepUpPercent =
      parseNumber(searchParams, "step") ??
      parseNumber(searchParams, "s") ??
      DEFAULTS.annualStepUpPercent;

    return {
      mode: "stepup",
      monthlyInvestment,
      annualStepUpPercent,
      annualReturnRate,
      years,
    };
  }

  return {
    mode: "sip",
    monthlyInvestment,
    annualReturnRate,
    years,
  };
}

function setIfFinite(params: URLSearchParams, key: string, value: number) {
  if (!Number.isFinite(value)) return;
  params.set(key, String(value));
}

export function searchParamsFromInputs(inputs: InvestmentInputs): URLSearchParams {
  const params = new URLSearchParams();
  params.set("mode", inputs.mode);
  setIfFinite(params, "rate", roundTo(inputs.annualReturnRate, 2));
  setIfFinite(params, "years", Math.round(inputs.years));

  if (inputs.mode === "lumpsum") {
    setIfFinite(params, "amt", Math.round(inputs.lumpsumInvestment));
    return params;
  }

  setIfFinite(params, "amt", Math.round(inputs.monthlyInvestment));

  if (inputs.mode === "stepup") {
    setIfFinite(params, "step", roundTo(inputs.annualStepUpPercent, 2));
  }

  return params;
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function hasAnyInputParams(searchParams: URLSearchParams): boolean {
  return (
    searchParams.has("mode") ||
    searchParams.has("amt") ||
    searchParams.has("m") ||
    searchParams.has("l") ||
    searchParams.has("rate") ||
    searchParams.has("r") ||
    searchParams.has("years") ||
    searchParams.has("y") ||
    searchParams.has("step") ||
    searchParams.has("s")
  );
}
