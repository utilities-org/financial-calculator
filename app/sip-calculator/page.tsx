import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import CalculatorClient from "./CalculatorClient";
import EmbedShell from "@/components/embed/EmbedShell";

export const metadata: Metadata = {
  title: "SIP Calculator (India) + Step-up + Lumpsum",
  description:
    "Calculate SIP, step-up SIP, and lumpsum returns with year-wise table and growth charts. Share inputs via URL.",
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
            Investment Calculator
          </h1>
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            Estimate returns for a monthly SIP, a yearly step-up SIP (by %), or a
            lumpsum investment. Results are calculated only when you click
            Calculate. You can share your inputs via the page URL.
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
              <li>Expected return rate is annual; compounding is monthly.</li>
              <li>
                Monthly SIP contributions are assumed at the beginning of each month.
              </li>
              <li>
                Step-up SIP increases the monthly SIP amount once per year by the
                given percentage.
              </li>
              <li>
                This is an estimate and does not include taxes, exit load, or fund
                expense ratio.
              </li>
            </ul>
          </section>
        ) : null}
      </main>
    </EmbedShell>
  );
}
