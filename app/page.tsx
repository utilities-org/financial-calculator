import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
	return (
		<main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
			<header className="mb-10 space-y-2">
				<h1 className="text-3xl font-semibold tracking-tight">
					Financial Calculators
				</h1>
				<p className="text-muted-foreground text-sm">
					India-focused investment calculators with shareable inputs.
				</p>
			</header>

			<Card>
				<CardHeader>
					<CardTitle>Investment Calculator</CardTitle>
					<CardDescription>
						SIP, Step-up SIP (yearly by %), and Lumpsum.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild>
						<Link href="/sip-calculator">Open calculator</Link>
					</Button>
				</CardContent>
			</Card>
		</main>
	);
}