export type HomeLoanMode = "emi" | "neutralize";

export type HomeLoanInputs =
  | {
      mode: "emi";
      principal: number; // INR
      annualInterestRate: number; // % (nominal)
      years: number;
    }
  | {
      mode: "neutralize";
      principal: number; // INR
      annualInterestRate: number; // % (nominal)
      years: number;
      mfMonthlyInvestment: number; // INR
      mfAnnualReturnRate: number; // % (effective annual -> monthly comp via calc)
    };

export type HomeLoanYearRow = {
  year: number;
  openingBalance: number;
  principalPaidYear: number;
  interestPaidYear: number;
  totalPaidYear: number;
  closingBalance: number;
  cumulativePrincipalPaid: number;
  cumulativeInterestPaid: number;
  cumulativeTotalPaid: number;
  mfInvestedTotal?: number;
  mfValue?: number;
  mfGains?: number;
};

export type HomeLoanMonthRow = {
  month: number; // 1-based overall month
  year: number; // 1-based
  monthOfYear: number; // 1-12
  openingBalance: number;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
  cumulativePrincipalPaid: number;
  cumulativeInterestPaid: number;
  cumulativeTotalPaid: number;
  mfInvestedTotal?: number;
  mfValue?: number;
  mfGains?: number;
};

export type HomeLoanResult = {
  inputs: HomeLoanInputs;
  months: number;
  monthlyRateLoan: number;
  emi: number;
  totalInterest: number;
  totalPayment: number;
  schedule: HomeLoanYearRow[];
  monthlySchedule: HomeLoanMonthRow[];
  mfMonthlyRate?: number;
  mfMaturityValue?: number;
  mfTotalInvested?: number;
  mfEstimatedGains?: number;
  mfRequiredMonthlyInvestmentToMatchInterest?: number;
  mfAmountLeftAfterInterest?: number;
};
