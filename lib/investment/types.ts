export type InvestmentMode = "sip" | "stepup" | "lumpsum" | "hybrid";

export type InvestmentInputs =
  | {
      mode: "sip";
      monthlyInvestment: number; // INR
      annualReturnRate: number; // %
      years: number;
    }
  | {
      mode: "stepup";
      monthlyInvestment: number; // INR (year 1)
      annualStepUpPercent: number; // % applied once per year
      annualReturnRate: number; // %
      years: number;
    }
  | {
      mode: "lumpsum";
      lumpsumInvestment: number; // INR
      annualReturnRate: number; // %
      years: number;
    }
  | {
      mode: "hybrid";
      monthlyInvestment: number; // INR
      stepUpEnabled: boolean;
      annualStepUpPercent: number; // % applied once per year when stepUpEnabled
      // Periodic lumpsum deposits (to model occasional/regular larger deposits)
      lumpsumAmount: number; // INR per deposit
      lumpsumEveryYears: number; // e.g. 1 = yearly, 2 = every 2 years
      lumpsumStartYear: number; // 1-based
      lumpsumEndYear: number; // 1-based
      annualReturnRate: number; // %
      years: number;
    };

export type YearlyRow = {
  year: number;
  investedThisYear: number;
  investedTotal: number;
  endValue: number;
  gainsTotal: number;
  sipMonthlyForYear?: number; // only for sip/stepup
  lumpsumThisYear?: number; // for hybrid periodic deposits
};

export type InvestmentResult = {
  inputs: InvestmentInputs;
  totalInvested: number;
  maturityValue: number;
  estimatedReturns: number;
  monthlyRate: number;
  schedule: YearlyRow[];
};
