"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { InvestmentInputs, InvestmentMode, InvestmentResult } from "@/lib/investment/types";
import { calculateInvestment, formatINR, modeLabel, normalizeInputs } from "@/lib/investment/calc";
import { inputsFromSearchParams, searchParamsFromInputs } from "@/lib/investment/url";
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

import InvestmentCharts from "@/components/investment/InvestmentCharts";
import InvestmentScheduleTable from "@/components/investment/InvestmentScheduleTable";

function numberFromInput(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isMode(value: string): value is InvestmentMode {
  return value === "sip" || value === "stepup" || value === "lumpsum";
}

export default function CalculatorClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const ignoreNextSearchParamsRef = React.useRef<string | null>(null);

  const [draft, setDraft] = React.useState<InvestmentInputs>(() => {
    const params = new URLSearchParams(searchParams?.toString());
    return inputsFromSearchParams(params);
  });

  const [result, setResult] = React.useState<InvestmentResult | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);

  // Keep inputs in sync with URL for shareability, without auto-calculating.
  React.useEffect(() => {
    const current = searchParams?.toString() ?? "";

    // If the URL change was initiated by our own Calculate action, don't
    // wipe results / force a second click.
    if (ignoreNextSearchParamsRef.current === current) {
      ignoreNextSearchParamsRef.current = null;
      return;
    }

    const params = new URLSearchParams(current);
    setDraft(inputsFromSearchParams(params));
    setResult(null);
    setErrors([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  function setMode(nextMode: InvestmentMode) {
    setDraft((prev) => {
      const normalized = normalizeInputs(prev);
      if (nextMode === normalized.mode) return normalized;

      if (nextMode === "lumpsum") {
        return {
          mode: "lumpsum",
          lumpsumInvestment:
            normalized.mode === "lumpsum" ? normalized.lumpsumInvestment : 100000,
          annualReturnRate: normalized.annualReturnRate,
          years: normalized.years,
        };
      }

      const monthlyInvestment =
        normalized.mode === "lumpsum" ? 5000 : normalized.monthlyInvestment;

      if (nextMode === "stepup") {
        return {
          mode: "stepup",
          monthlyInvestment,
          annualStepUpPercent: 10,
          annualReturnRate: normalized.annualReturnRate,
          years: normalized.years,
        };
      }

      return {
        mode: "sip",
        monthlyInvestment,
        annualReturnRate: normalized.annualReturnRate,
        years: normalized.years,
      };
    });
    setResult(null);
    setErrors([]);
  }

  function validate(next: InvestmentInputs): string[] {
    const normalized = normalizeInputs(next);
    const issues: string[] = [];

    if (normalized.years < 1) issues.push("Years must be at least 1.");

    if (normalized.mode === "lumpsum") {
      if (normalized.lumpsumInvestment <= 0)
        issues.push("Lumpsum amount must be greater than 0.");
    } else {
      if (normalized.monthlyInvestment <= 0)
        issues.push("Monthly SIP amount must be greater than 0.");
    }

    if (normalized.annualReturnRate <= -100)
      issues.push("Expected return must be greater than -100%.");

    return issues;
  }

  function onCalculate(e: React.FormEvent) {
    e.preventDefault();

    const normalized = normalizeInputs(draft);
    const issues = validate(normalized);
    setErrors(issues);

    if (issues.length) {
      setResult(null);
      return;
    }

    const computed = calculateInvestment(normalized);
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
          <CardDescription>
            Update inputs, then click Calculate to see results.
          </CardDescription>
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
                      <SelectItem value="sip">SIP</SelectItem>
                      <SelectItem value="stepup">Step-up SIP</SelectItem>
                      <SelectItem value="lumpsum">Lumpsum</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {draft.mode === "lumpsum" ? (
                <Field>
                  <FieldLabel>Lumpsum amount (₹)</FieldLabel>
                  <Input
                    inputMode="numeric"
                    value={draft.lumpsumInvestment}
                    onChange={(e) =>
                      setDraft((p) =>
                        p.mode === "lumpsum"
                          ? {
                              ...p,
                              lumpsumInvestment: numberFromInput(e.target.value),
                            }
                          : p
                      )
                    }
                  />
                  {formatIndianAmountHint(draft.lumpsumInvestment) ? (
                    <div className="text-muted-foreground mt-1 text-xs">
                      {formatIndianAmountHint(draft.lumpsumInvestment)}
                    </div>
                  ) : null}
                </Field>
              ) : (
                <Field>
                  <FieldLabel>Monthly SIP (₹)</FieldLabel>
                  <Input
                    inputMode="numeric"
                    value={draft.monthlyInvestment}
                    onChange={(e) =>
                      setDraft((p) =>
                        p.mode === "lumpsum"
                          ? p
                          : {
                              ...p,
                              monthlyInvestment: numberFromInput(e.target.value),
                            }
                      )
                    }
                  />
                  {formatIndianAmountHint(draft.monthlyInvestment) ? (
                    <div className="text-muted-foreground mt-1 text-xs">
                      {formatIndianAmountHint(draft.monthlyInvestment)}
                    </div>
                  ) : null}
                </Field>
              )}

              {draft.mode === "stepup" && (
                <Field>
                  <FieldLabel>Annual step-up (%)</FieldLabel>
                  <Input
                    inputMode="decimal"
                    value={draft.annualStepUpPercent}
                    onChange={(e) =>
                      setDraft((p) =>
                        p.mode === "stepup"
                          ? {
                              ...p,
                              annualStepUpPercent: numberFromInput(e.target.value),
                            }
                          : p
                      )
                    }
                  />
                </Field>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Expected return (% p.a.)</FieldLabel>
                  <Input
                    inputMode="decimal"
                    value={draft.annualReturnRate}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        annualReturnRate: numberFromInput(e.target.value),
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Time period (years)</FieldLabel>
                  <Input
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="min-w-0 rounded-lg border p-3">
                <div className="text-muted-foreground text-xs">Invested</div>
                <div className="break-words text-sm font-semibold tabular-nums">
                  {formatINR(result.totalInvested)}
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {formatIndianCompact(result.totalInvested)}
                </div>
              </div>
              <div className="min-w-0 rounded-lg border p-3">
                <div className="text-muted-foreground text-xs">Returns</div>
                <div
                  className={
                    result.estimatedReturns >= 0
                      ? "break-words text-emerald-700 dark:text-emerald-400 text-sm font-semibold tabular-nums"
                      : "break-words text-destructive text-sm font-semibold tabular-nums"
                  }
                >
                  {formatINR(result.estimatedReturns)}
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {formatIndianCompact(result.estimatedReturns)}
                </div>
              </div>
              <div
                className="min-w-0 rounded-lg border p-3"
                style={{
                  borderColor: "var(--color-chart-4)",
                  background:
                    "color-mix(in oklch, var(--color-chart-4) 12%, transparent)",
                }}
              >
                <div className="text-muted-foreground text-xs">Maturity value</div>
                <div
                  className="break-words text-lg font-semibold tabular-nums"
                  style={{ color: "var(--color-chart-4)" }}
                >
                  {formatINR(result.maturityValue)}
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {formatIndianCompact(result.maturityValue)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Results will appear here after you click Calculate.
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-4">
          {result ? (
            <>
              <InvestmentCharts result={result} />
              <div className="text-muted-foreground text-xs">
                Share this scenario by copying the page URL.
              </div>
            </>
          ) : null}
        </CardFooter>
      </Card>

      {result ? (
        <div className="min-w-0 md:col-span-2">
          <InvestmentScheduleTable result={result} />
        </div>
      ) : null}
    </div>
  );
}
