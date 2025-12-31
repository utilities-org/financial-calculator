import type { HomeLoanInputs, HomeLoanMode } from "@/lib/loan/types";

const DEFAULTS = {
  mode: "emi" as HomeLoanMode,
  principal: 1_000_000,
  annualInterestRate: 8.5,
  years: 20,
  mfMonthlyInvestment: 10_000,
  mfAnnualReturnRate: 12,
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

function parseMode(searchParams: URLSearchParams): HomeLoanMode {
  const m = (getFirst(searchParams, "mode") ?? "").toLowerCase();
  if (m === "emi" || m === "neutralize") return m;
  return DEFAULTS.mode;
}

export function inputsFromSearchParams(searchParams: URLSearchParams): HomeLoanInputs {
  const mode = parseMode(searchParams);

  const principal =
    parseNumber(searchParams, "principal") ??
    parseNumber(searchParams, "p") ??
    parseNumber(searchParams, "amt") ??
    DEFAULTS.principal;

  const annualInterestRate =
    parseNumber(searchParams, "rate") ??
    parseNumber(searchParams, "r") ??
    DEFAULTS.annualInterestRate;

  const years =
    parseNumber(searchParams, "years") ??
    parseNumber(searchParams, "y") ??
    DEFAULTS.years;

  if (mode === "neutralize") {
    const mfMonthlyInvestment =
      parseNumber(searchParams, "sip") ??
      parseNumber(searchParams, "mfSip") ??
      DEFAULTS.mfMonthlyInvestment;

    const mfAnnualReturnRate =
      parseNumber(searchParams, "mfRate") ??
      parseNumber(searchParams, "mfr") ??
      DEFAULTS.mfAnnualReturnRate;

    return {
      mode: "neutralize",
      principal,
      annualInterestRate,
      years,
      mfMonthlyInvestment,
      mfAnnualReturnRate,
    };
  }

  return {
    mode: "emi",
    principal,
    annualInterestRate,
    years,
  };
}

function setIfFinite(params: URLSearchParams, key: string, value: number) {
  if (!Number.isFinite(value)) return;
  params.set(key, String(value));
}

export function searchParamsFromInputs(inputs: HomeLoanInputs): URLSearchParams {
  const params = new URLSearchParams();

  params.set("mode", inputs.mode);
  setIfFinite(params, "principal", Math.round(inputs.principal));
  setIfFinite(params, "rate", roundTo(inputs.annualInterestRate, 3));
  setIfFinite(params, "years", Math.round(inputs.years));

  if (inputs.mode === "neutralize") {
    setIfFinite(params, "sip", Math.round(inputs.mfMonthlyInvestment));
    setIfFinite(params, "mfRate", roundTo(inputs.mfAnnualReturnRate, 3));
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
    searchParams.has("principal") ||
    searchParams.has("p") ||
    searchParams.has("amt") ||
    searchParams.has("rate") ||
    searchParams.has("r") ||
    searchParams.has("years") ||
    searchParams.has("y") ||
    searchParams.has("sip") ||
    searchParams.has("mfSip") ||
    searchParams.has("mfRate") ||
    searchParams.has("mfr")
  );
}
