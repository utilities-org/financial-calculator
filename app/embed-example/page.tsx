"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type FontPresetKey = "inter" | "poppins" | "roboto_slab" | "space_grotesk";

const FONT_PRESETS: Record<
  FontPresetKey,
  {
    label: string;
    fontFamily: string;
    fontUrl: string;
  }
> = {
  inter: {
    label: "Inter",
    fontFamily: "Inter",
    fontUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
  poppins: {
    label: "Poppins",
    fontFamily: "Poppins",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  },
  roboto_slab: {
    label: "Roboto Slab",
    fontFamily: "Roboto Slab",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;500;600;700&display=swap",
  },
  space_grotesk: {
    label: "Space Grotesk",
    fontFamily: "Space Grotesk",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
  },
};

type ThemePresetKey = "acme_dark" | "ocean_light" | "plum_dark";

const THEME_PRESETS: Record<
  ThemePresetKey,
  {
    label: string;
    brand: string;
    logo: string;
    accent: string;
    accent2: string;
    bg: string;
    fg: string;
    fontPreset: FontPresetKey;
  }
> = {
  acme_dark: {
    label: "Acme (Dark)",
    brand: "Acme Finance",
    logo: "https://dummyimage.com/120x40/000/fff.png&text=ACME",
    accent: "#0ea5e9",
    accent2: "#22c55e",
    bg: "#0a0a0a",
    fg: "#fafafa",
    fontPreset: "inter",
  },
  ocean_light: {
    label: "Ocean (Light)",
    brand: "Ocean Wealth",
    logo: "https://dummyimage.com/140x40/0ea5e9/0a0a0a.png&text=OCEAN",
    accent: "#0284c7",
    accent2: "#16a34a",
    bg: "#ffffff",
    fg: "#0a0a0a",
    fontPreset: "poppins",
  },
  plum_dark: {
    label: "Plum (Dark)",
    brand: "Plum Advisory",
    logo: "https://dummyimage.com/140x40/a855f7/0a0a0a.png&text=PLUM",
    accent: "#a855f7",
    accent2: "#f97316",
    bg: "#0a0a0a",
    fg: "#fafafa",
    fontPreset: "space_grotesk",
  },
};

function buildEmbedSrc(path: string, params: Record<string, string>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v.trim().length) sp.set(k, v.trim());
  }
  return `${path}?${sp.toString()}`;
}

export default function EmbedExamplePage() {
  const [themePreset, setThemePreset] = React.useState<ThemePresetKey>("acme_dark");

  const [copiedKey, setCopiedKey] = React.useState<"sip" | "loan" | null>(null);

  const [brand, setBrand] = React.useState(THEME_PRESETS[themePreset].brand);
  const [logo, setLogo] = React.useState(THEME_PRESETS[themePreset].logo);
  const [accent, setAccent] = React.useState(THEME_PRESETS[themePreset].accent);
  const [accent2, setAccent2] = React.useState(THEME_PRESETS[themePreset].accent2);
  const [bg, setBg] = React.useState(THEME_PRESETS[themePreset].bg);
  const [fg, setFg] = React.useState(THEME_PRESETS[themePreset].fg);
  const [fontPreset, setFontPreset] = React.useState<FontPresetKey>(
    THEME_PRESETS[themePreset].fontPreset
  );
  const [fontFamily, setFontFamily] = React.useState(FONT_PRESETS[fontPreset].fontFamily);
  const [fontUrl, setFontUrl] = React.useState(FONT_PRESETS[fontPreset].fontUrl);

  React.useEffect(() => {
    const preset = THEME_PRESETS[themePreset];
    setBrand(preset.brand);
    setLogo(preset.logo);
    setAccent(preset.accent);
    setAccent2(preset.accent2);
    setBg(preset.bg);
    setFg(preset.fg);
    setFontPreset(preset.fontPreset);

    const fp = FONT_PRESETS[preset.fontPreset];
    setFontFamily(fp.fontFamily);
    setFontUrl(fp.fontUrl);
  }, [themePreset]);

  React.useEffect(() => {
    const fp = FONT_PRESETS[fontPreset];
    setFontFamily(fp.fontFamily);
    setFontUrl(fp.fontUrl);
  }, [fontPreset]);

  const baseParams = {
    embed: "1",
    brand,
    logo,
    accent,
    accent2,
    bg,
    fg,
    fontFamily,
    fontUrl,
  };

  const sipEmbedSrc = buildEmbedSrc("/sip-calculator", baseParams);
  const loanEmbedSrc = buildEmbedSrc("/home-loan-emi-calculator", baseParams);

  async function copyToClipboard(key: "sip" | "loan", value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for older browsers / denied clipboard permission
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1200);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Embed Playground</h1>
        <p className="text-muted-foreground">
          Change branding params and see the embedded calculators update live.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branding Controls</CardTitle>
          <CardDescription>
            Tip: Use HTTPS for logo, hex colors for accents/background.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <FieldGroup>
              <Field>
                <FieldLabel>Theme preset</FieldLabel>
                <Select value={themePreset} onValueChange={(v) => setThemePreset(v as ThemePresetKey)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Object.entries(THEME_PRESETS).map(([key, p]) => (
                        <SelectItem key={key} value={key}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Brand name</FieldLabel>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Acme Finance" />
              </Field>

              <Field>
                <FieldLabel>Logo URL (https)</FieldLabel>
                <Input
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://..."
                />
              </Field>

              <Field>
                <FieldLabel>Font preset</FieldLabel>
                <Select value={fontPreset} onValueChange={(v) => setFontPreset(v as FontPresetKey)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Object.entries(FONT_PRESETS).map(([key, p]) => (
                        <SelectItem key={key} value={key}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Accent (hex)</FieldLabel>
                <Input value={accent} onChange={(e) => setAccent(e.target.value)} placeholder="#0ea5e9" />
              </Field>
              <Field>
                <FieldLabel>Accent 2 (hex)</FieldLabel>
                <Input value={accent2} onChange={(e) => setAccent2(e.target.value)} placeholder="#22c55e" />
              </Field>
              <Field>
                <FieldLabel>Background (hex)</FieldLabel>
                <Input value={bg} onChange={(e) => setBg(e.target.value)} placeholder="#0a0a0a" />
              </Field>
              <Field>
                <FieldLabel>Foreground (hex)</FieldLabel>
                <Input value={fg} onChange={(e) => setFg(e.target.value)} placeholder="#fafafa" />
              </Field>

              <Field>
                <FieldLabel>Font family</FieldLabel>
                <Input
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  placeholder="Inter"
                />
              </Field>

              <Field>
                <FieldLabel>Google Fonts CSS URL</FieldLabel>
                <Input
                  value={fontUrl}
                  onChange={(e) => setFontUrl(e.target.value)}
                  placeholder="https://fonts.googleapis.com/css2?family=Inter..."
                />
              </Field>
            </FieldGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle>SIP Calculator (Embedded)</CardTitle>
            <CardDescription
              className="font-mono text-xs break-all md:truncate"
              title={sipEmbedSrc}
            >
              {sipEmbedSrc}
            </CardDescription>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => copyToClipboard("sip", sipEmbedSrc)}
            >
              {copiedKey === "sip" ? "Copied" : "Copy URL"}
            </Button>
            <Button asChild variant="secondary">
              <Link href={sipEmbedSrc} target="_blank" rel="noreferrer">
                Open
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <iframe
            title="SIP Calculator Embed"
            src={sipEmbedSrc}
            className="w-full rounded-lg border"
            style={{ height: 900 }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle>Home Loan EMI Calculator (Embedded)</CardTitle>
            <CardDescription
              className="font-mono text-xs break-all md:truncate"
              title={loanEmbedSrc}
            >
              {loanEmbedSrc}
            </CardDescription>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => copyToClipboard("loan", loanEmbedSrc)}
            >
              {copiedKey === "loan" ? "Copied" : "Copy URL"}
            </Button>
            <Button asChild variant="secondary">
              <Link href={loanEmbedSrc} target="_blank" rel="noreferrer">
                Open
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <iframe
            title="Home Loan EMI Calculator Embed"
            src={loanEmbedSrc}
            className="w-full rounded-lg border"
            style={{ height: 980 }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
