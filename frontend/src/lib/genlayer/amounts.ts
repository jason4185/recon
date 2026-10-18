export const GEN_DECIMALS = 18;
export const GEN_UNIT = 1000000000000000000n;

export function parseGenAmount(value: string) {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,18})?$/.test(normalized)) {
    throw new Error("Enter a GEN amount with no more than 18 decimal places.");
  }
  const [whole = "0", fraction = ""] = normalized.split(".");
  return BigInt(whole) * GEN_UNIT + BigInt(fraction.padEnd(18, "0") || "0");
}

export function formatGen(value: bigint) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / GEN_UNIT;
  const fraction = (absolute % GEN_UNIT).toString().padStart(18, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function formatGenFromWei(value: bigint) {
  return `${formatGen(value)} GEN`;
}
