"use client";

import * as React from "react";

import { parseEmbedBranding } from "@/lib/embed/branding";
import { cn } from "@/lib/utils";

function loadFontStylesheetOnce(href: string) {
  if (typeof document === "undefined") return;
  const existing = document.querySelector(`link[data-embed-font="true"][href="${CSS.escape(href)}"]`);
  if (existing) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-embed-font", "true");
  document.head.appendChild(link);
}

export default function EmbedShell({
  children,
  className,
  searchParamsString,
}: {
  children: React.ReactNode;
  className?: string;
  searchParamsString?: string;
}) {
  const branding = React.useMemo(() => {
    const params = new URLSearchParams(searchParamsString ?? "");
    return parseEmbedBranding(params);
  }, [searchParamsString]);

  React.useEffect(() => {
    if (!branding.embed) return;
    if (!branding.fontUrl) return;
    loadFontStylesheetOnce(branding.fontUrl);
  }, [branding.embed, branding.fontUrl]);

  if (!branding.embed) {
    return <>{children}</>;
  }

  const accent = branding.accent;
  const accent2 = branding.accent2 ?? branding.accent;

  const style: React.CSSProperties = {
    ...(branding.background
      ? { "--background": branding.background, "--card": branding.background, "--popover": branding.background }
      : null),
    ...(branding.foreground
      ? {
          "--foreground": branding.foreground,
          "--card-foreground": branding.foreground,
          "--popover-foreground": branding.foreground,
        }
      : null),
    ...(accent
      ? {
          "--primary": accent,
          "--ring": accent,
          "--chart-4": accent,
        }
      : null),
    ...(accent2
      ? {
          "--chart-2": accent2,
        }
      : null),
    ...(branding.fontFamily
      ? {
          "--font-sans": branding.fontFamily,
          fontFamily: `${branding.fontFamily}, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`,
        }
      : null),
  } as React.CSSProperties;

  const showBrandBar = !!(branding.brandName || branding.logoUrl);

  return (
    <div className={cn("w-full font-sans", className)} style={style}>
      {showBrandBar ? (
        <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.brandName ?? "Brand"}
              className="h-7 w-auto"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          ) : null}
          {branding.brandName ? (
            <div className="text-sm font-semibold tracking-tight">
              {branding.brandName}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="px-4 py-6">{children}</div>
    </div>
  );
}
