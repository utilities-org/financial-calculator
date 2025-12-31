export type InvestmentMode = "sip" | "stepup" | "lumpsum";

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
    };

export type YearlyRow = {
  year: number;
  investedThisYear: number;
  investedTotal: number;
  endValue: number;
  gainsTotal: number;
  sipMonthlyForYear?: number; // only for sip/stepup
};

export type InvestmentResult = {
  inputs: InvestmentInputs;
  totalInvested: number;
  maturityValue: number;
  estimatedReturns: number;
  monthlyRate: number;
  schedule: YearlyRow[];
};
