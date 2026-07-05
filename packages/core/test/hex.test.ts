import { describe, it, expect } from "vitest";
import {
  decimalStringToHex,
  hexToBigInt,
  hexToDecimalString,
  isHexString,
  toDecimalString,
  formatUnits,
} from "../src/hex.js";

describe("hex helpers", () => {
  it("converts decimal string to hex", () => {
    expect(decimalStringToHex("0")).toBe("0x0");
    expect(decimalStringToHex("255")).toBe("0xff");
    expect(decimalStringToHex("80000000000")).toBe("0x12a05f2000");
    expect(decimalStringToHex(255n)).toBe("0xff");
  });

  it("converts hex to bigint and decimal string", () => {
    expect(hexToBigInt("0xff")).toBe(255n);
    expect(hexToBigInt("0x")).toBe(0n);
    expect(hexToDecimalString("0x12a05f2000")).toBe("80000000000");
    expect(hexToDecimalString("0x0")).toBe("0");
  });

  it("normalises hex or decimal input to decimal", () => {
    expect(toDecimalString("0xff")).toBe("255");
    expect(toDecimalString("255")).toBe("255");
    expect(toDecimalString(255)).toBe("255");
  });

  it("detects hex strings", () => {
    expect(isHexString("0xabc")).toBe(true);
    expect(isHexString("0x")).toBe(true);
    expect(isHexString("abc")).toBe(false);
    expect(isHexString(123)).toBe(false);
  });

  it("handles invalid hex", () => {
    expect(() => hexToDecimalString("nothex")).toThrow();
    expect(() => hexToBigInt("0xzz")).toThrow();
    expect(() => decimalStringToHex("-5")).toThrow();
    expect(() => toDecimalString("abc")).toThrow();
  });

  it("formats base units to human amounts", () => {
    expect(formatUnits("80000000000", 8)).toBe("800");
    expect(formatUnits("150000000", 8)).toBe("1.5");
    expect(formatUnits("1", 8)).toBe("0.00000001");
    expect(formatUnits("500000000", 6)).toBe("500");
  });
});
