export const MAX_EVIDENCE_BYTES = 8_192;
export const MAX_EVIDENCE_URL_LENGTH = 2_048;
export const MAX_RESPONSE_LENGTH = 2_048;
export const MAX_REQUEST_ID_LENGTH = 64;
const MAX_JSON_DEPTH = 64;

export type EvidenceVerificationInput = {
  url: string;
  agreementId: string;
  requestIds: string[];
};

export type EvidenceVerificationResult = {
  url: string;
  filename: string;
  byteLength: number;
  agreementId: string;
  responseCount: number;
  requestIds: string[];
  sha256: string;
};

export function isEvidenceVerificationForAgreement(result: EvidenceVerificationResult, expected: { url: string; agreementId: string; requestIds: string[] }) {
  if (result.url !== expected.url || result.agreementId !== expected.agreementId) return false;
  const registered = new Set(expected.requestIds);
  return result.requestIds.every((requestId) => registered.has(requestId));
}

type JsonObject = { [key: string]: JsonValue };
type JsonValue = null | boolean | string | JsonNumber | JsonValue[] | JsonObject;
class JsonNumberToken {
  readonly kind = "number" as const;

  constructor(readonly raw: string) {}
}
type JsonNumber = JsonNumberToken;

export class EvidenceVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceVerificationError";
  }
}

export function isCurrentEvidenceVerification(serial: number, currentSerial: number, snapshotKey: string, currentKey: string) {
  return serial === currentSerial && snapshotKey === currentKey;
}

function fail(message: string): never {
  throw new EvidenceVerificationError(message);
}

function isRecord(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function codePointLength(value: string) {
  return Array.from(value).length;
}

function hasDisallowedControl(value: string) {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if ((codePoint < 0x20 && codePoint !== 0x09 && codePoint !== 0x0a && codePoint !== 0x0d) || codePoint === 0x7f) {
      return true;
    }
  }
  return false;
}

function validateRequestId(value: unknown, field: string): string {
  if (typeof value !== "string" || codePointLength(value) === 0 || codePointLength(value) > MAX_REQUEST_ID_LENGTH) {
    fail(`${field} is invalid.`);
  }
  if (!/^[a-z0-9][a-z0-9_.-]*$/.test(value)) fail(`${field} is invalid.`);
  return value;
}

function validateResponse(value: unknown): string {
  if (typeof value !== "string" || codePointLength(value) > MAX_RESPONSE_LENGTH || hasDisallowedControl(value)) {
    fail("Evidence response must be text up to 2,048 characters.");
  }
  return value;
}

function parseJsonNumber(raw: string): JsonNumber {
  return new JsonNumberToken(raw);
}

class StrictJsonParser {
  private index = 0;

  constructor(private readonly text: string) {}

  parse(): JsonValue {
    const value = this.parseValue(0);
    this.skipWhitespace();
    if (this.index !== this.text.length) fail("Evidence JSON contains trailing data.");
    return value;
  }

  private parseValue(depth: number): JsonValue {
    if (depth > MAX_JSON_DEPTH) fail("Evidence JSON is too deeply nested.");
    this.skipWhitespace();
    const character = this.text[this.index];
    if (character === "{") return this.parseObject(depth + 1);
    if (character === "[") return this.parseArray(depth + 1);
    if (character === '"') return this.parseString();
    if (this.text.startsWith("true", this.index)) {
      this.index += 4;
      return true;
    }
    if (this.text.startsWith("false", this.index)) {
      this.index += 5;
      return false;
    }
    if (this.text.startsWith("null", this.index)) {
      this.index += 4;
      return null;
    }
    const number = this.text.slice(this.index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u)?.[0];
    if (number) {
      this.index += number.length;
      return parseJsonNumber(number);
    }
    fail("Evidence JSON is malformed.");
  }

  private parseObject(depth: number): JsonObject {
    this.index += 1;
    const result: JsonObject = {};
    this.skipWhitespace();
    if (this.text[this.index] === "}") {
      this.index += 1;
      return result;
    }
    while (this.index < this.text.length) {
      this.skipWhitespace();
      if (this.text[this.index] !== '"') fail("Evidence JSON object keys must be strings.");
      const key = this.parseString();
      if (Object.prototype.hasOwnProperty.call(result, key)) fail("Evidence JSON contains duplicate keys.");
      this.skipWhitespace();
      if (this.text[this.index] !== ":") fail("Evidence JSON object is malformed.");
      this.index += 1;
      result[key] = this.parseValue(depth);
      this.skipWhitespace();
      if (this.text[this.index] === "}") {
        this.index += 1;
        return result;
      }
      if (this.text[this.index] !== ",") fail("Evidence JSON object is malformed.");
      this.index += 1;
    }
    fail("Evidence JSON object is unterminated.");
  }

  private parseArray(depth: number): JsonValue[] {
    this.index += 1;
    const result: JsonValue[] = [];
    this.skipWhitespace();
    if (this.text[this.index] === "]") {
      this.index += 1;
      return result;
    }
    while (this.index < this.text.length) {
      result.push(this.parseValue(depth));
      this.skipWhitespace();
      if (this.text[this.index] === "]") {
        this.index += 1;
        return result;
      }
      if (this.text[this.index] !== ",") fail("Evidence JSON array is malformed.");
      this.index += 1;
    }
    fail("Evidence JSON array is unterminated.");
  }

  private parseString(): string {
    const start = this.index;
    this.index += 1;
    while (this.index < this.text.length) {
      const character = this.text[this.index];
      if (character === "\\") {
        this.index += 2;
        continue;
      }
      if (character === '"') {
        this.index += 1;
        try {
          return JSON.parse(this.text.slice(start, this.index)) as string;
        } catch {
          fail("Evidence JSON contains an invalid string.");
        }
      }
      this.index += 1;
    }
    fail("Evidence JSON string is unterminated.");
  }

  private skipWhitespace() {
    while (this.index < this.text.length && " \t\n\r".includes(this.text[this.index])) this.index += 1;
  }
}

export function validateNetlifyEvidenceUrl(value: string): URL {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_EVIDENCE_URL_LENGTH || !value.startsWith("https://") || !/^[\x21-\x7e]+$/u.test(value)) {
    fail("Use HTTPS on a direct *.netlify.app host with no credentials, port, or fragment.");
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    fail("Enter a valid HTTPS Netlify URL.");
  }
  const authority = value.slice("https://".length).split(/[/?#]/u, 1)[0] ?? "";
  const hostname = parsed.hostname.toLowerCase();
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hash || authority.includes(":") || authority.includes("@") || hostname.endsWith(".") || hostname === "netlify.app" || !hostname.endsWith(".netlify.app")) {
    fail("Use HTTPS on a direct *.netlify.app host with no credentials, port, or fragment.");
  }
  const labels = hostname.split(".");
  if (labels.some((label) => !label || label.startsWith("-") || label.endsWith("-") || !/^[a-z0-9-]+$/u.test(label))) {
    fail("The Netlify hostname is invalid.");
  }
  return parsed;
}

export function parseEvidenceDocument(bytes: Uint8Array, expected: { agreementId: string; requestIds: string[] }) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_EVIDENCE_BYTES) fail("Evidence exceeds the 8,192-byte limit.");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("Evidence is not valid UTF-8.");
  }
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) fail("Evidence JSON contains an invalid UTF-8 BOM.");
  const parsed = new StrictJsonParser(text).parse();
  if (!isRecord(parsed) || Object.keys(parsed).length !== 2 || !Object.prototype.hasOwnProperty.call(parsed, "agreement_id") || !Object.prototype.hasOwnProperty.call(parsed, "responses")) {
    fail("Evidence must contain only agreement_id and responses.");
  }
  const document = parsed as JsonObject;
  const agreementValue = document.agreement_id;
  if (!(agreementValue instanceof JsonNumberToken) || !/^(0|[1-9]\d*)$/u.test(agreementValue.raw)) {
    fail("Evidence agreement_id is invalid.");
  }
  let agreementId: bigint;
  try {
    agreementId = BigInt(agreementValue.raw);
  } catch {
    fail("Evidence agreement_id is invalid.");
  }
  if (agreementId <= 0n || agreementId !== BigInt(expected.agreementId)) fail("Evidence agreement ID does not match this agreement.");
  const responses = document.responses;
  if (!Array.isArray(responses) || responses.length > expected.requestIds.length) fail("Evidence responses are invalid.");
  const registered = new Set(expected.requestIds);
  const submitted = new Set<string>();
  for (const item of responses) {
    if (!isRecord(item) || Object.keys(item).length !== 2 || !Object.prototype.hasOwnProperty.call(item, "request_id") || !Object.prototype.hasOwnProperty.call(item, "response")) {
      fail("Each evidence response must contain only request_id and response.");
    }
    const responseObject = item as JsonObject;
    const requestId = validateRequestId(responseObject.request_id, "Evidence request_id");
    if (!registered.has(requestId)) fail(`Evidence request ${requestId} is not registered.`);
    if (submitted.has(requestId)) fail(`Evidence request ${requestId} is duplicated.`);
    submitted.add(requestId);
    validateResponse(responseObject.response);
  }
  return { agreementId: agreementId.toString(), requestIds: [...submitted], responseCount: responses.length };
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) fail("SHA-256 is unavailable in this runtime.");
  const digestInput = new Uint8Array(bytes.byteLength);
  digestInput.set(bytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", digestInput);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

async function readResponseBytes(response: Response): Promise<Uint8Array> {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength && /^\d+$/u.test(declaredLength) && Number(declaredLength) > MAX_EVIDENCE_BYTES) fail("Evidence exceeds the 8,192-byte limit.");
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_EVIDENCE_BYTES) fail("Evidence exceeds the 8,192-byte limit.");
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      const chunk = next.value;
      total += chunk.byteLength;
      if (total > MAX_EVIDENCE_BYTES) fail("Evidence exceeds the 8,192-byte limit.");
      chunks.push(chunk);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    if (error instanceof EvidenceVerificationError) throw error;
    fail("Evidence download was interrupted.");
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function evidenceFilename(url: URL) {
  const segment = url.pathname.split("/").filter(Boolean).at(-1) ?? "evidence.json";
  try {
    return decodeURIComponent(segment) || "evidence.json";
  } catch {
    return segment;
  }
}

export async function fetchAndVerifyEvidence(input: EvidenceVerificationInput, fetchImpl: typeof fetch = fetch): Promise<EvidenceVerificationResult> {
  const parsedUrl = validateNetlifyEvidenceUrl(input.url);
  if (!/^[1-9]\d*$/u.test(input.agreementId) || input.requestIds.length < 1 || input.requestIds.length > 5 || new Set(input.requestIds).size !== input.requestIds.length) fail("The loaded agreement is invalid.");
  for (const requestId of input.requestIds) validateRequestId(requestId, "The loaded request id");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let response: Response;
  try {
    response = await fetchImpl(input.url, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers: { Accept: "application/json", "Cache-Control": "no-cache", Pragma: "no-cache" },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof EvidenceVerificationError) throw error;
    if (controller.signal.aborted || error instanceof DOMException && error.name === "AbortError") fail("Evidence request timed out.");
    fail("Evidence URL could not be fetched.");
  } finally {
    clearTimeout(timeout);
  }
  if (response.status < 200 || response.status >= 300) {
    if (response.status >= 300 && response.status < 400) fail("Evidence redirects are not allowed.");
    fail(`Evidence server returned HTTP ${response.status}.`);
  }
  const bytes = await readResponseBytes(response);
  const parsed = parseEvidenceDocument(bytes, input);
  const sha256 = await sha256Hex(bytes);
  return {
    url: input.url,
    filename: evidenceFilename(parsedUrl),
    byteLength: bytes.byteLength,
    agreementId: parsed.agreementId,
    responseCount: parsed.responseCount,
    requestIds: parsed.requestIds,
    sha256,
  };
}
