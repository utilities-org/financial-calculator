"use client";

import * as React from "react";

import type { HomeLoanResult } from "@/lib/loan/types";
import { formatINR } from "@/lib/investment/calc";
import { modeLabel } from "@/lib/loan/calc";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomeLoanScheduleTable({
  result,
}: {
  result: HomeLoanResult;
}) {
  const showMF = result.inputs.mode === "neutralize";

  const baseCalendarYear = new Date().getFullYear();

  const maxYear = Math.max(1, result.inputs.years);
  const [view, setView] = React.useState<"yearly" | "monthly">("yearly");
  const [selectedYear, setSelectedYear] = React.useState<number>(1);

  React.useEffect(() => {
    setSelectedYear(1);
    setView("yearly");
  }, [result.inputs.mode, result.inputs.principal, result.inputs.annualInterestRate, result.inputs.years]);

  React.useEffect(() => {
    if (showMF) setView("yearly");
  }, [showMF]);

  const monthlyRowsForSelectedYear = React.useMemo(() => {
    const y = Math.min(maxYear, Math.max(1, Math.round(selectedYear)));
    return result.monthlySchedule.filter((r) => r.year === y);
  }, [result.monthlySchedule, maxYear, selectedYear]);

  const selectedCalendarYear = baseCalendarYear + (Math.min(maxYear, Math.max(1, Math.round(selectedYear))) - 1);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Amortization details</CardTitle>
        <CardDescription>
          Schedule for {modeLabel(result.inputs.mode)} (fixed rate, no prepayment).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showMF ? (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">View</label>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={view}
              onChange={(e) => setView(e.target.value === "monthly" ? "monthly" : "yearly")}
            >
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly (select year)</option>
            </select>

            {view === "monthly" ? (
              <>
                <label className="text-sm font-medium">Year</label>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={String(selectedYear)}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {Array.from({ length: maxYear }, (_, i) => i + 1).map((y) => (
                    <option key={y} value={String(y)}>
                      {baseCalendarYear + (y - 1)}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="min-w-0 w-full max-w-full overflow-x-auto overscroll-x-contain">
          {showMF || view === "yearly" ? (
            <table className="w-full min-w-220 border-collapse text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="px-3 py-2 text-left font-medium">Year</th>
                  <th className="px-3 py-2 text-right font-medium">Opening</th>
                  <th className="px-3 py-2 text-right font-medium">Principal (year)</th>
                  <th className="px-3 py-2 text-right font-medium">Interest (year)</th>
                  <th className="px-3 py-2 text-right font-medium">Total paid (year)</th>
                  <th className="px-3 py-2 text-right font-medium">Closing</th>
                  <th className="px-3 py-2 text-right font-medium">Interest (total)</th>
                  {showMF ? (
                    <>
                      <th className="px-3 py-2 text-right font-medium">MF invested</th>
                      <th className="px-3 py-2 text-right font-medium">MF value</th>
                      <th className="px-3 py-2 text-right font-medium">MF gains</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((row) => {
                  const gains = row.mfGains ?? 0;

                  return (
                    <tr key={row.year} className="border-b">
                      <td className="px-3 py-2 text-left">{row.year}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatINR(row.openingBalance)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatINR(row.principalPaidYear)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-destructive font-medium">
                        {formatINR(row.interestPaidYear)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatINR(row.totalPaidYear)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {formatINR(row.closingBalance)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-destructive">
                        {formatINR(row.cumulativeInterestPaid)}
                      </td>
                      {showMF ? (
                        <>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatINR(row.mfInvestedTotal ?? 0)}
                          </td>
                          <td
                            className="px-3 py-2 text-right font-semibold tabular-nums"
                            style={{ color: "var(--color-chart-4)" }}
                          >
                            {formatINR(row.mfValue ?? 0)}
                          </td>
                          <td
                            className={
                              gains >= 0
                                ? "px-3 py-2 text-right tabular-nums text-emerald-700 dark:text-emerald-400 font-medium"
                                : "px-3 py-2 text-right tabular-nums text-destructive font-medium"
                            }
                          >
                            {formatINR(gains)}
                          </td>
                        </>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-220 border-collapse text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="px-3 py-2 text-left font-medium">
                    Month ({selectedCalendarYear})
                  </th>
                  <th className="px-3 py-2 text-right font-medium">Opening</th>
                  <th className="px-3 py-2 text-right font-medium">EMI</th>
                  <th className="px-3 py-2 text-right font-medium">Principal</th>
                  <th className="px-3 py-2 text-right font-medium">Interest</th>
                  <th className="px-3 py-2 text-right font-medium">Closing</th>
                  {showMF ? (
                    <>
                      <th className="px-3 py-2 text-right font-medium">MF invested</th>
                      <th className="px-3 py-2 text-right font-medium">MF value</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {monthlyRowsForSelectedYear.map((row) => (
                  <tr key={row.month} className="border-b">
                    <td className="px-3 py-2 text-left">{row.monthOfYear}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatINR(row.openingBalance)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatINR(row.emi)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatINR(row.principalPaid)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-destructive font-medium">
                      {formatINR(row.interestPaid)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {formatINR(row.closingBalance)}
                    </td>
                    {showMF ? (
                      <>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatINR(row.mfInvestedTotal ?? 0)}
                        </td>
                        <td
                          className="px-3 py-2 text-right font-semibold tabular-nums"
                          style={{ color: "var(--color-chart-4)" }}
                        >
                          {formatINR(row.mfValue ?? 0)}
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
