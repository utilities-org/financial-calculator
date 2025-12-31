import type { InvestmentResult } from "@/lib/investment/types";
import { formatINR, modeLabel } from "@/lib/investment/calc";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InvestmentScheduleTable({
  result,
}: {
  result: InvestmentResult;
}) {
  const showSipCol = result.inputs.mode !== "lumpsum";

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Year-wise breakdown</CardTitle>
        <CardDescription>
          Future value schedule for {modeLabel(result.inputs.mode)}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-w-0 w-full max-w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="text-muted-foreground border-b">
                <th className="px-3 py-2 text-left font-medium">Year</th>
                {showSipCol ? (
                  <th className="px-3 py-2 text-right font-medium">
                    {result.inputs.mode === "stepup"
                      ? "SIP/month (this year)"
                      : "SIP/month"}
                  </th>
                ) : null}
                <th className="px-3 py-2 text-right font-medium">
                  Invested (year)
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  Invested (total)
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  Value (year end)
                </th>
                <th className="px-3 py-2 text-right font-medium">Gains</th>
              </tr>
            </thead>
            <tbody>
              {result.schedule.map((row) => (
                <tr key={row.year} className="border-b">
                  <td className="px-3 py-2 text-left">{row.year}</td>
                  {showSipCol ? (
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatINR(row.sipMonthlyForYear ?? 0)}
                    </td>
                  ) : null}
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatINR(row.investedThisYear)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatINR(row.investedTotal)}
                  </td>
                  <td
                    className="px-3 py-2 text-right font-semibold tabular-nums"
                    style={{ color: "var(--color-chart-4)" }}
                  >
                    {formatINR(row.endValue)}
                  </td>
                  <td
                    className={
                      row.gainsTotal >= 0
                        ? "px-3 py-2 text-right tabular-nums text-emerald-700 dark:text-emerald-400 font-medium"
                        : "px-3 py-2 text-right tabular-nums text-destructive font-medium"
                    }
                  >
                    {formatINR(row.gainsTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
