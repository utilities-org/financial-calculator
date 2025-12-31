"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { HomeLoanInputs, HomeLoanMode, HomeLoanResult } from "@/lib/loan/types";
import { calculateHomeLoan, modeLabel } from "@/lib/loan/calc";
import { inputsFromSearchParams, searchParamsFromInputs } from "@/lib/loan/url";

import { formatINR } from "@/lib/investment/calc";
import { formatIndianAmountHint, formatIndianCompact } from "@/lib/investment/format";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import HomeLoanScheduleTable from "@/components/loan/HomeLoanScheduleTable";

function numberFromInput(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isMode(value: string): value is HomeLoanMode {
  return value === "emi" || value === "neutralize";
}

export default function CalculatorClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const ignoreNextSearchParamsRef = React.useRef<string | null>(null);

  const [draft, setDraft] = React.useState<HomeLoanInputs>(() => {
    const params = new URLSearchParams(searchParams?.toString());
    return inputsFromSearchParams(params);
  });

  // Keep text versions for decimal fields so users can type values like `0.5`
  // or intermediate values like `0.` without the UI snapping to `0`.
  const [annualInterestRateText, setAnnualInterestRateText] = React.useState<string>(() =>
    String(draft.annualInterestRate)
  );
  const [mfAnnualReturnRateText, setMfAnnualReturnRateText] = React.useState<string>(() =>
    draft.mode === "neutralize" ? String(draft.mfAnnualReturnRate) : "12"
  );

  const [result, setResult] = React.useState<HomeLoanResult | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);

  // Keep inputs in sync with URL for shareability, without auto-calculating.
  React.useEffect(() => {
    const current = searchParams?.toString() ?? "";

    if (ignoreNextSearchParamsRef.current === current) {
      ignoreNextSearchParamsRef.current = null;
      return;
    }

    const params = new URLSearchParams(current);
    const nextDraft = inputsFromSearchParams(params);
    setDraft(nextDraft);
    setAnnualInterestRateText(String(nextDraft.annualInterestRate));
    setMfAnnualReturnRateText(
      nextDraft.mode === "neutralize" ? String(nextDraft.mfAnnualReturnRate) : "12"
    );
    setResult(null);
    setErrors([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  function setMode(nextMode: HomeLoanMode) {
    setDraft((prev) => {
      if (nextMode === prev.mode) return prev;

      if (nextMode === "neutralize") {
        setMfAnnualReturnRateText("12");
        return {
          mode: "neutralize",
          principal: prev.principal,
          annualInterestRate: prev.annualInterestRate,
          years: prev.years,
          mfMonthlyInvestment: 10_000,
          mfAnnualReturnRate: 12,
        };
      }

      return {
        mode: "emi",
        principal: prev.principal,
        annualInterestRate: prev.annualInterestRate,
        years: prev.years,
      };
    });
    setResult(null);
    setErrors([]);
  }

  function validate(next: HomeLoanInputs): string[] {
    const issues: string[] = [];

    if (next.principal <= 0) issues.push("Loan amount must be greater than 0.");
    if (next.years < 1) issues.push("Loan tenure must be at least 1 year.");
    if (next.annualInterestRate < 0) issues.push("Interest rate cannot be negative.");

    if (next.mode === "neutralize") {
      if (next.mfMonthlyInvestment < 0)
        issues.push("MF monthly investment cannot be negative.");
      if (next.mfAnnualReturnRate <= -100)
        issues.push("MF expected return must be greater than -100%.");
    }

    return issues;
  }

  function onCalculate(e: React.FormEvent) {
    e.preventDefault();

    const issues = validate(draft);
    setErrors(issues);

    if (issues.length) {
      setResult(null);
      return;
    }

    const computed = calculateHomeLoan(draft);
    setResult(computed);

    const params = searchParamsFromInputs(computed.inputs);
    const nextQuery = params.toString();
    ignoreNextSearchParamsRef.current = nextQuery;
    router.replace(`${pathname}?${nextQuery}`);
  }

  const title = `${modeLabel(draft.mode)} Calculator`;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Update inputs, then click Calculate.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-6" onSubmit={onCalculate}>
            <FieldGroup>
              <Field>
                <FieldLabel>Calculator type</FieldLabel>
                <Select
                  value={draft.mode}
                  onValueChange={(v) => {
                    if (isMode(v)) setMode(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="emi">Home loan EMI</SelectItem>
                      <SelectItem value="neutralize">EMI + MF neutralizer</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Loan amount (₹)</FieldLabel>
                <Input
                  type="number"
                  step={1000}
                  inputMode="numeric"
                  value={draft.principal}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      principal: numberFromInput(e.target.value),
                    }))
                  }
                />
                {formatIndianAmountHint(draft.principal) ? (
                  <div className="text-muted-foreground mt-1 text-xs">
                    {formatIndianAmountHint(draft.principal)}
                  </div>
                ) : null}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Interest rate (% p.a.)</FieldLabel>
                  <Input
                    type="number"
                    step={0.1}
                    inputMode="decimal"
                    value={annualInterestRateText}
                    onChange={(e) => {
                      const nextText = e.target.value;
                      setAnnualInterestRateText(nextText);
                      const nextNumber = Number(nextText);
                      if (Number.isFinite(nextNumber)) {
                        setDraft((p) => ({
                          ...p,
                          annualInterestRate: nextNumber,
                        }));
                      }
                    }}
                  />
                </Field>

                <Field>
                  <FieldLabel>Loan tenure (years)</FieldLabel>
                  <Input
                    type="number"
                    step={1}
                    inputMode="numeric"
                    value={draft.years}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        years: numberFromInput(e.target.value),
                      }))
                    }
                  />
                </Field>
              </div>

              {draft.mode === "neutralize" ? (
                <>
                  <Field>
                    <FieldLabel>MF monthly investment (₹)</FieldLabel>
                    <Input
                      type="number"
                      step={500}
                      inputMode="numeric"
                      value={draft.mfMonthlyInvestment}
                      onChange={(e) =>
                        setDraft((p) =>
                          p.mode === "neutralize"
                            ? {
                                ...p,
                                mfMonthlyInvestment: numberFromInput(e.target.value),
                              }
                            : p
                        )
                      }
                    />
                    {formatIndianAmountHint(draft.mfMonthlyInvestment) ? (
                      <div className="text-muted-foreground mt-1 text-xs">
                        {formatIndianAmountHint(draft.mfMonthlyInvestment)}
                      </div>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel>MF expected return (% p.a.)</FieldLabel>
                    <Input
                      type="number"
                      step={0.1}
                      inputMode="decimal"
                      value={mfAnnualReturnRateText}
                      onChange={(e) => {
                        const nextText = e.target.value;
                        setMfAnnualReturnRateText(nextText);
                        const nextNumber = Number(nextText);
                        if (Number.isFinite(nextNumber)) {
                          setDraft((p) =>
                            p.mode === "neutralize"
                              ? {
                                  ...p,
                                  mfAnnualReturnRate: nextNumber,
                                }
                              : p
                          );
                        }
                      }}
                    />
                  </Field>
                </>
              ) : null}

              {errors.length > 0 && (
                <div className="text-destructive text-sm">
                  <ul className="list-disc space-y-1 pl-5">
                    {errors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button type="submit" className="w-full">
                Calculate
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            {result
              ? `Calculated for ${modeLabel(result.inputs.mode)}.`
              : "Enter inputs and click Calculate."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {result ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                className="min-w-0 rounded-lg border p-3"
                style={{
                  borderColor: "var(--color-chart-4)",
                  background:
                    "color-mix(in oklch, var(--color-chart-4) 12%, transparent)",
                }}
              >
                <div className="text-muted-foreground text-xs">Monthly EMI</div>
                <div
                  className="wrap-break-word text-lg font-semibold tabular-nums"
                  style={{ color: "var(--color-chart-4)" }}
                >
                  {formatINR(result.emi)}
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {formatIndianCompact(result.emi)}
                </div>
              </div>

              <div className="min-w-0 rounded-lg border p-3">
                <div className="text-muted-foreground text-xs">Total interest</div>
                <div className="wrap-break-word text-sm font-semibold tabular-nums">
                  {formatINR(result.totalInterest)}
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {formatIndianCompact(result.totalInterest)}
                </div>
              </div>

              <div className="min-w-0 rounded-lg border p-3">
                <div className="text-muted-foreground text-xs">Loan amount</div>
                <div className="wrap-break-word text-sm font-semibold tabular-nums">
                  {formatINR(result.inputs.principal)}
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {formatIndianCompact(result.inputs.principal)}
                </div>
              </div>

              <div className="min-w-0 rounded-lg border p-3">
                <div className="text-muted-foreground text-xs">Total payment</div>
                <div className="wrap-break-word text-sm font-semibold tabular-nums">
                  {formatINR(result.totalPayment)}
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {formatIndianCompact(result.totalPayment)}
                </div>
              </div>

              {result.inputs.mode === "neutralize" ? (
                <>
                  <div className="min-w-0 rounded-lg border p-3">
                    <div className="text-muted-foreground text-xs">
                      MF corpus (maturity)
                    </div>
                    <div className="wrap-break-word text-sm font-semibold tabular-nums">
                      {formatINR(result.mfMaturityValue ?? 0)}
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      {formatIndianCompact(result.mfMaturityValue ?? 0)}
                    </div>
                  </div>

                  <div
                    className="min-w-0 rounded-lg border p-3"
                    style={{
                      borderColor: "var(--color-chart-2)",
                      background:
                        "color-mix(in oklch, var(--color-chart-2) 12%, transparent)",
                    }}
                  >
                    <div className="text-muted-foreground text-xs">
                      MF amount left (after interest)
                    </div>
                    <div
                      className="wrap-break-word text-sm font-semibold tabular-nums"
                      style={{ color: "var(--color-chart-2)" }}
                    >
                      {formatINR(result.mfAmountLeftAfterInterest ?? 0)}
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      {formatIndianCompact(result.mfAmountLeftAfterInterest ?? 0)}
                    </div>
                  </div>

                  <div className="min-w-0 rounded-lg border p-3">
                    <div className="text-muted-foreground text-xs">
                      SIP needed to match interest
                    </div>
                    <div className="wrap-break-word text-sm font-semibold tabular-nums">
                      {formatINR(result.mfRequiredMonthlyInvestmentToMatchInterest ?? 0)}
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      {formatIndianCompact(
                        result.mfRequiredMonthlyInvestmentToMatchInterest ?? 0
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Results will appear here after you click Calculate.
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-4">
          {result ? (
            <div className="text-muted-foreground text-xs">
              Share this scenario by copying the page URL.
            </div>
          ) : null}
        </CardFooter>
      </Card>

      {result ? (
        <div className="min-w-0 md:col-span-2">
          <HomeLoanScheduleTable result={result} />
        </div>
      ) : null}
    </div>
  );
}
