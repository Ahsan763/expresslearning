import AuditLog from "../modules/auditLog.module.js";

/**
 * Extracts the real client IP, respecting common reverse-proxy headers.
 * Works with nginx, AWS ALB, Cloudflare, etc.
 *
 * In production, set `app.set("trust proxy", 1)` in server.js so Express
 * populates req.ip from X-Forwarded-For automatically.
 */
export const getClientIp = (req) => {
  return (
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};

/**
 * Write a security audit event to the database (fire-and-forget).
 *
 * Usage:
 *   await auditLog(req, "LOGIN_SUCCESS", { userId: user._id, email: user.email });
 *   await auditLog(req, "LOGIN_FAILED",  { email, meta: { reason: "bad password" } });
 *
 * @param {object} req     - Express request (used for ip / userAgent)
 * @param {string} event   - One of the enum values in auditLogModule
 * @param {object} options - { userId?, email?, meta? }
 */
export const auditLog = async (req, event, { userId = null, email = null, meta = null } = {}) => {
  try {
    await AuditLog.create({
      event,
      userId,
      email,
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || null,
      meta,
    });
  } catch (err) {
    // Never let audit logging crash the main flow
    console.error("auditLog write failed:", err.message);
  }
};