import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import CalculatorClient from "./CalculatorClient";
import EmbedShell from "@/components/embed/EmbedShell";

export const metadata: Metadata = {
  title: "Home Loan EMI Calculator (India) + MF Neutralizer",
  description:
    "Calculate home loan EMI, total interest, and a year-wise amortization table. Optionally compare with a mutual fund SIP corpus to offset interest over the loan tenure.",
};

function isEmbed(searchParams: Record<string, string | string[] | undefined> | undefined): boolean {
  const raw = searchParams?.embed ?? searchParams?.e;
  const first = Array.isArray(raw) ? raw[0] : raw;
  return first === "1" || first === "true";
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const embed = isEmbed(resolvedSearchParams);

  const searchParamsString = (() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedSearchParams ?? {})) {
      if (typeof value === "string") params.append(key, value);
      else if (Array.isArray(value)) value.forEach((v) => typeof v === "string" && params.append(key, v));
    }
    return params.toString();
  })();

  return (
    <EmbedShell searchParamsString={searchParamsString}>
      <main className={embed ? "w-full" : "mx-auto w-full max-w-5xl px-4 py-10 sm:px-6"}>
        <header className={embed ? "mb-6 space-y-2" : "mb-8 space-y-2"}>
          {!embed ? (
            <p className="text-muted-foreground text-sm">
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </p>
          ) : null}

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Home Loan EMI Calculator
          </h1>
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            Calculate your monthly EMI and view a year-wise amortization schedule.
            You can also switch to “EMI + MF neutralizer” to compare the loan’s
            total interest vs an estimated mutual fund SIP corpus.
          </p>
        </header>

        <Suspense
          fallback={
            <div className="text-muted-foreground text-sm">Loading calculator…</div>
          }
        >
          <CalculatorClient />
        </Suspense>

        {!embed ? (
          <section className="mt-10 max-w-3xl space-y-3 text-sm">
            <h2 className="text-base font-medium">Assumptions</h2>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5">
              <li>Home loan EMI uses a fixed interest rate and fixed EMI.</li>
              <li>No part-prepayment and no tenure/rate changes are modeled.</li>
              <li>
                Loan interest rate is treated as nominal per annum (monthly rate =
                annual/12).
              </li>
              <li>
                In MF mode, SIP contributions are assumed at the beginning of each
                month and returns compound monthly.
              </li>
              <li>
                This is an estimate and does not include taxes, charges, or fund
                expense ratio.
              </li>
            </ul>
          </section>
        ) : null}
      </main>
    </EmbedShell>
  );
}
