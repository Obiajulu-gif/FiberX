/** Convert a human amount (e.g. "1.5") to base units given decimals. */
export function parseUnits(human: string, decimals: number): string {
  const trimmed = human.trim();
  if (trimmed === "" || !/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid amount: ${human}`);
  }
  const [whole, frac = ""] = trimmed.split(".");
  const paddedFrac = (frac + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${whole}${paddedFrac}`.replace(/^0+(?=\d)/, "");
  return BigInt(combined || "0").toString();
}

export const CURRENCIES = {
  CKB: { code: "CKB", displayName: "CKB", decimals: 8 },
  RUSD: { code: "RUSD", displayName: "RUSD", decimals: 6 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
