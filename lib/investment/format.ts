function formatNumberShort(value: number): string {
  // Keep 0–2 decimals, trim trailing zeros.
  const rounded = Math.round(value * 100) / 100;
  const s = rounded.toFixed(2);
  return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function formatINRNumber(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(safe));
}

export function formatIndianAmountHint(amount: number): string | null {
  if (!Number.isFinite(amount) || amount === 0) return null;

  const abs = Math.abs(amount);

  if (abs < 100) {
    return `${formatINRNumber(amount)}`;
  }

  if (abs < 1000) {
    return `${formatINRNumber(amount)} (${formatNumberShort(amount / 100)} hundred)`;
  }

  if (abs < 100000) {
    return `${formatINRNumber(amount)} (${formatNumberShort(amount / 1000)} thousand)`;
  }

  if (abs < 10000000) {
    return `${formatINRNumber(amount)} (${formatNumberShort(amount / 100000)} lakh)`;
  }

  return `${formatINRNumber(amount)} (${formatNumberShort(amount / 10000000)} crore)`;
}

export function formatIndianCompact(amount: number): string {
  if (!Number.isFinite(amount)) return "0";

  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);

  if (abs < 1000) {
    return `${sign}${formatINRNumber(abs)}`;
  }

  if (abs < 100000) {
    return `${sign}${formatNumberShort(abs / 1000)} thousand`;
  }

  if (abs < 10000000) {
    return `${sign}${formatNumberShort(abs / 100000)} lakh`;
  }

  return `${sign}${formatNumberShort(abs / 10000000)} crore`;
}
