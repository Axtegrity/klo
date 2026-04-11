/**
 * MFA cryptographic helpers.
 *
 * TOTP secrets are AES-256-GCM encrypted at rest using MFA_ENCRYPTION_KEY.
 * Backup codes are bcrypt-hashed (cost 10) before storage.
 */

import { hash, compare } from "bcryptjs";
import { createCipheriv, createDecipheriv, randomBytes, randomInt } from "crypto";
import * as OTPAuth from "otpauth";

// ── Encryption ─────────────────────────────────────────────────────────────

function getEncryptionKey(): Buffer {
  const keyHex = process.env.MFA_ENCRYPTION_KEY;
  if (!keyHex) throw new Error("MFA_ENCRYPTION_KEY env var is not set");
  const buf = Buffer.from(keyHex, "hex");
  if (buf.length !== 32)
    throw new Error("MFA_ENCRYPTION_KEY must be exactly 32 bytes (64 hex chars)");
  return buf;
}

/**
 * Encrypts a plaintext string with AES-256-GCM.
 * Returns "iv:authTag:ciphertext" (all hex-encoded).
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts an "iv:authTag:ciphertext" string produced by encryptSecret.
 */
export function decryptSecret(encoded: string): string {
  const [ivHex, tagHex, cipherHex] = encoded.split(":");
  if (!ivHex || !tagHex || !cipherHex) throw new Error("Invalid encrypted secret format");
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

// ── TOTP ───────────────────────────────────────────────────────────────────

/** Generates a new TOTP secret (base32-encoded, 20 bytes). */
export function generateTotpSecret(): string {
  // OTPAuth.Secret({ size }) generates cryptographically random bytes internally
  return new OTPAuth.Secret({ size: 20 }).base32;
}

/** Builds the otpauth:// URI for QR code rendering. */
export function buildOtpAuthUri(secret: string, email: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: "KLO",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

/**
 * Verifies a 6-digit TOTP code.
 * Accepts ±1 window (30s grace) to cover clock skew.
 */
export function verifyTotpCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: "KLO",
    label: "user",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

// ── Backup Codes ───────────────────────────────────────────────────────────

const BACKUP_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // unambiguous chars
const BACKUP_CODE_LENGTH = 8;
const BACKUP_CODE_COUNT = 8;

/** Generates 8 plaintext backup codes. */
export function generateBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, () =>
    Array.from({ length: BACKUP_CODE_LENGTH }, () =>
      BACKUP_CODE_CHARSET[randomInt(BACKUP_CODE_CHARSET.length)]
    ).join("")
  );
}

/** Returns bcrypt hashes of the provided codes (cost 10). */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((c) => hash(c, 10)));
}

/**
 * Checks whether a submitted code matches any stored hash.
 * Returns the index of the matching hash, or -1 if none matched.
 * The caller must remove the matched hash from storage (one-time use).
 */
export async function verifyBackupCode(
  submitted: string,
  hashes: string[]
): Promise<number> {
  const results = await Promise.all(
    hashes.map((h) => compare(submitted.toUpperCase().trim(), h))
  );
  return results.findIndex(Boolean);
}
