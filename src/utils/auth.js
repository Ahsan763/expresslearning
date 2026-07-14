import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12; // Bumped from 10 → 12 for better security

export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const compareHashPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
/**
 * SHA-256 hash of a token string.
 * Used to compare an incoming raw token against the stored hash.
 */
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
/**
 * Generates a cryptographically secure random token (hex string).
 * Returns the raw token (sent in email) AND the hashed version (stored in DB).
 *
 * Pattern:
 *   const { rawToken, hashedToken } = generateSecureToken();
 *   sendEmail(rawToken);          // user clicks this in their email
 *   user.someTokenField = hashedToken;  // only hash goes to DB
 *
 * On verify: hash the incoming token, compare to what's in DB.
 */
export const generateSecureToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  return { rawToken, hashedToken };
};

