import { createHash, randomBytes } from "node:crypto";

const EMAIL_MAX_LENGTH = 254;
const TOKEN_BYTES = 32;
const TOKEN_HEX_LENGTH = TOKEN_BYTES * 2;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const SHORT_LIVED_TOKEN_TTL_MS = 60 * 60 * 1000;

export const createToken = () => randomBytes(TOKEN_BYTES).toString("hex");

export const hashValue = (value: string) => createHash("sha256").update(value).digest("hex");

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isValidEmail = (email: string) => {
  if (!email || email.length > EMAIL_MAX_LENGTH) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidToken = (token: string) => {
  if (!token || token.length !== TOKEN_HEX_LENGTH) return false;
  return /^[a-f0-9]+$/i.test(token);
};

export const tokenExpiresAt = (ttlMs: number = TOKEN_TTL_MS) =>
  new Date(Date.now() + ttlMs).toISOString();

export const shortLivedTokenExpiresAt = () => tokenExpiresAt(SHORT_LIVED_TOKEN_TTL_MS);

export const getClientIp = (request: Request, clientAddress?: string) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const headerIp = forwardedFor?.split(",")[0]?.trim();
  return headerIp || clientAddress || null;
};
