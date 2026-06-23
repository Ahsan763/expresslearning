import "dotenv/config";
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dns from "node:dns";
import path from "path";
import connectDb from "./src/config/db.js";
import corsOptions from "./src/config/cors.config.js";
import routes from "./src/routes/index.js";
import { AppError } from "./src/utils/app.error.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

export function createApp() {
  connectDb();

  const app = express();

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(cors(corsOptions));
  app.all("/*splat", cors(corsOptions));
  app.use(helmet());

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please try again later." },
  });
  app.use(globalLimiter);

  app.use(express.json({ limit: "10kb" }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use("/", routes);

  app.get("/", (_req, res) => {
    res.json({ success: true, message: "API is running." });
  });

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found." });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.message?.startsWith("CORS policy:")) {
      return res.status(403).json({ success: false, message: err.message });
    }

    const statusCode = err.statusCode || 500;
    const message =
      statusCode === 500 ? "Internal server error." : err.message;

    if (statusCode === 500) {
      console.error("Unhandled error:", err);
    }

    res.status(statusCode).json({ success: false, message });
  });

  return app;
}
