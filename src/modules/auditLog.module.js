import mongoose from "mongoose";

/**
 * AuditLog — immutable security event record.
 *
 * Collection: auditlogs
 * Folder:     modules/auditLogModule.js
 *
 * Every document is append-only; nothing is ever updated or deleted here.
 * Use TTL index (90 days) so old logs are cleaned up automatically.
 */
const auditLogSchema = new mongoose.Schema(
  {
    // Which security event happened
    event: {
      type: String,
      required: true,
      enum: [
        "SIGNUP",
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "LOGIN_BLOCKED_LOCKED",
        "ACCOUNT_LOCKED",
        "ACCOUNT_UNLOCKED",
        "EMAIL_VERIFIED",
        "PASSWORD_RESET_REQUESTED",
        "PASSWORD_RESET_SUCCESS",
        "PASSWORD_CHANGED",
        "VERIFICATION_EMAIL_RESENT",
        "LOGIN_BLOCKED_UNVERIFIED",
      ],
    },

    // The user this event relates to (null for failed logins where user wasn't found)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },

    // The email involved (useful when userId is null)
    email: {
      type: String,
      default: null,
    },

    // Network info
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },

    // Optional extra context (e.g. { attemptNumber: 3 })
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    // createdAt is our event timestamp; no updatedAt needed (append-only)
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Auto-delete logs older than 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Fast lookup by userId or email for security dashboards
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ email: 1 });
auditLogSchema.index({ event: 1 });

export default mongoose.model("auditlogs", auditLogSchema);