/**
 * CORS Configuration
 * Folder: config/corsConfig.js
 *
 * Whitelists only the origins listed in ALLOWED_ORIGINS env var.
 * In development you can set:  ALLOWED_ORIGINS=http://localhost:3000
 * In production set both your www and non-www domains:
 *   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
 *
 * Why a function instead of a string origin?
 *   - Allows multiple domains from one env var
 *   - Allows server-to-server requests (no Origin header) in non-production
 *   - Gives a clear error when a blocked origin tries to connect
 */

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

const corsOptions = {
  origin: (requestOrigin, callback) => {
    // Allow requests with no Origin header (e.g. curl, Postman, server-to-server)
    // but only outside production. In production every browser request has Origin.
    if (!requestOrigin) {
      if (process.env.NODE_ENV === "production") {
        return callback(new Error("Requests without an Origin header are not allowed in production."), false);
      }
      return callback(null, true);
    }

    if (allowedOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS policy: origin '${requestOrigin}' is not allowed.`),
      false
    );
  },

  // Which HTTP methods browsers are allowed to use
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // Which request headers the browser is allowed to send
  allowedHeaders: ["Content-Type", "Authorization"],

  // Allow cookies / Authorization headers to be sent cross-origin
  credentials: true,

  // Cache the preflight response for 1 hour (reduces OPTIONS round-trips)
  maxAge: 3600,
};

export default corsOptions;