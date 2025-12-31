"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { InvestmentResult } from "@/lib/investment/types";
import { formatINR } from "@/lib/investment/calc";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartRow = {
  year: number;
  invested: number;
  value: number;
  gains: number;
};

export default function InvestmentCharts({ result }: { result: InvestmentResult }) {
  const data: ChartRow[] = React.useMemo(
    () =>
      result.schedule.map((r) => ({
        year: r.year,
        invested: r.investedTotal,
        value: r.endValue,
        gains: Math.max(0, r.gainsTotal),
      })),
    [result.schedule]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={70}
                tickFormatter={(v) => {
                  if (typeof v !== "number") return "";
                  if (Math.abs(v) >= 10_000_000) return `${(v / 10_000_000).toFixed(1)}Cr`;
                  if (Math.abs(v) >= 100_000) return `${(v / 100_000).toFixed(1)}L`;
                  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}K`;
                  return String(Math.round(v));
                }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (typeof value === "number") return [formatINR(value), String(name)];
                  return [String(value), String(name)];
                }}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="invested"
                name="Invested"
                stroke="var(--color-chart-2)"
                fill="var(--color-chart-2)"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="value"
                name="Value"
                stroke="var(--color-chart-4)"
                fill="var(--color-chart-4)"
                fillOpacity={0.25}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
