export type EmbedBranding = {
  embed: boolean;
  brandName: string | null;
  logoUrl: string | null;
  accent: string | null;
  accent2: string | null;
  background: string | null;
  foreground: string | null;
  fontFamily: string | null;
  fontUrl: string | null;
};

function first(params: URLSearchParams, key: string): string | null {
  const v = params.get(key);
  if (!v) return null;
  const t = v.trim();
  return t.length ? t : null;
}

function isHexColor(value: string): boolean {
  const v = value.startsWith("#") ? value.slice(1) : value;
  return /^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?$/.test(v);
}

function normalizeHexColor(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isHexColor(trimmed)) return null;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function normalizeHttpsUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function normalizeFontUrl(value: string | null): string | null {
  const url = normalizeHttpsUrl(value);
  if (!url) return null;

  // Security/safety: only allow Google Fonts CSS URLs by default.
  // Partners can still set fontFamily to a system font without a URL.
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host === "fonts.googleapis.com") return url;
    return null;
  } catch {
    return null;
  }
}

export function parseEmbedBranding(params: URLSearchParams): EmbedBranding {
  const embedRaw = first(params, "embed") ?? first(params, "e");
  const embed = embedRaw === "1" || embedRaw === "true";

  const brandName = first(params, "brand") ?? first(params, "brandName");
  const logoUrl = normalizeHttpsUrl(first(params, "logo") ?? first(params, "logoUrl"));

  const accent = normalizeHexColor(first(params, "accent") ?? first(params, "primary"));
  const accent2 = normalizeHexColor(first(params, "accent2"));

  const background = normalizeHexColor(first(params, "bg") ?? first(params, "background"));
  const foreground = normalizeHexColor(first(params, "fg") ?? first(params, "foreground"));

  const fontFamily = first(params, "fontFamily") ?? first(params, "font");
  const fontUrl = normalizeFontUrl(first(params, "fontUrl"));

  return {
    embed,
    brandName,
    logoUrl,
    accent,
    accent2,
    background,
    foreground,
    fontFamily,
    fontUrl,
  };
}
