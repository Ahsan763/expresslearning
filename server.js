/**
 * Entry point
 * Folder: server.js  (project root)
 */
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import connectDb from "./config/db.js";
import corsOptions from "./config/corsConfig.js";
import authRoutes from "./routes/authRoutes.js";
import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);
dotenv.config();
connectDb();

const app = express();

// ─── Trust Proxy ──────────────────────────────────────────────────────────────
// Required so req.ip contains the real client IP when running behind
// nginx / AWS ALB / Heroku / any reverse proxy.
// Set to the number of proxies in front of Express (1 is correct for most setups).
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Must come BEFORE helmet and routes so preflight OPTIONS requests are handled.
// Config lives in config/corsConfig.js — set ALLOWED_ORIGINS in your .env.
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests for all routes
app.all('/*splat', cors(corsOptions));

// ─── Security Headers ─────────────────────────────────────────────────────────
// helmet sets ~14 HTTP headers: CSP, HSTS, no-sniff, XSS filter, etc.
app.use(helmet());

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
// 100 requests per 15 min per IP across the whole API.
// Auth routes get a tighter limiter applied directly in authRoutes.js.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use(globalLimiter);

// ─── General Middleware ────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // Reject oversized payloads
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", inde);

app.get("/", (req, res) => {
  res.json({ success: true, message: "API is running." });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Catches CORS errors and any other unhandled errors thrown in middleware/routes.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // CORS errors come through here — send a clear 403 instead of a 500
  if (err.message && err.message.startsWith("CORS policy:")) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});