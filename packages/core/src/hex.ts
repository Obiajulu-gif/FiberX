/**
 * Hex <-> decimal helpers.
 *
 * Fiber's JSON-RPC returns most numeric fields as `0x`-prefixed hex strings
 * (CKB convention). The SDK exposes decimal strings to consumers so that big
 * balances never lose precision. All conversions go through BigInt.
 */

/** True for strings like "0x", "0x0", "0x1a2b". Case-insensitive. */
export function isHexString(value: unknown): value is string {
  return typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value);
}

/**
 * Convert a `0x`-prefixed hex string to a decimal string.
 * `"0x"` and `"0x0"` both map to `"0"`.
 */
export function hexToDecimalString(value: string): string {
  if (!isHexString(value)) {
    throw new Error(`Invalid hex string: ${String(value)}`);
  }
  const body = value.slice(2);
  if (body === "") return "0";
  return BigInt(value).toString(10);
}

/** Convert a hex string to a BigInt. */
export function hexToBigInt(value: string): bigint {
  if (!isHexString(value)) {
    throw new Error(`Invalid hex string: ${String(value)}`);
  }
  const body = value.slice(2);
  return body === "" ? 0n : BigInt(value);
}

/**
 * Convert a decimal string (or number/bigint) to a `0x`-prefixed hex string.
 * Negative values are rejected — Fiber amounts are always non-negative.
 */
export function decimalStringToHex(value: string | number | bigint): string {
  const big = typeof value === "bigint" ? value : BigInt(value);
  if (big < 0n) {
    throw new Error(`Cannot encode negative value as hex: ${String(value)}`);
  }
  return "0x" + big.toString(16);
}

/**
 * Accept either a decimal or hex string and always return a decimal string.
 * Useful when normalising RPC responses whose numeric encoding varies.
 */
export function toDecimalString(value: string | number | bigint): string {
  if (typeof value === "number" || typeof value === "bigint") {
    return BigInt(value).toString(10);
  }
  if (isHexString(value)) {
    return hexToDecimalString(value);
  }
  // Assume it is already a decimal string; validate it.
  if (!/^-?\d+$/.test(value)) {
    throw new Error(`Invalid numeric string: ${value}`);
  }
  return BigInt(value).toString(10);
}

/**
 * Render a base-unit amount (decimal string) as a human-readable amount,
 * given the number of decimals. e.g. formatUnits("80000000000", 8) -> "800".
 */
export function formatUnits(baseUnits: string, decimals = 0): string {
  const negative = baseUnits.startsWith("-");
  const digits = (negative ? baseUnits.slice(1) : baseUnits).padStart(
    decimals + 1,
    "0",
  );
  const whole = digits.slice(0, digits.length - decimals) || "0";
  const frac = decimals > 0 ? digits.slice(digits.length - decimals) : "";
  const trimmedFrac = frac.replace(/0+$/, "");
  const body = trimmedFrac ? `${whole}.${trimmedFrac}` : whole;
  return negative ? `-${body}` : body;
}
