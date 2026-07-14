import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import departmentRoutes from "./routes/departments.js";
import doctorRoutes from "./routes/doctors.js";
import hospitalRoutes from "./routes/hospitals.js";
import registrationPeopleRoutes from "./routes/registration-people.js";
import registrationRoutes from "./routes/registrations.js";
import scheduleRoutes from "./routes/schedules.js";
import accountRoutes from "./routes/accounts.js";
import feedbackRoutes from "./routes/feedback.js";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { accessGuard } from "./middleware/access-guard.js";

const isAllowedOrigin = (origin: string): boolean => {
  if (env.CORS_ORIGINS.includes(origin)) return true;
  if (env.NODE_ENV !== "development") return false;
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
};

export const app = express();
app.disable("x-powered-by");
app.use(pinoHttp());
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) callback(null, true);
    else callback(null, false);
  },
  methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "platform"],
  maxAge: 86400,
}));
app.use(express.json({ limit: "1mb" }));
app.use("/avatars", express.static(new URL("../public/avatars", import.meta.url).pathname, { maxAge: "30d", immutable: true }));
app.use(accessGuard);

app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/hospitals", hospitalRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/doctors", doctorRoutes);
app.use("/api/v1/registration-people", registrationPeopleRoutes);
app.use("/api/v1/registrations", registrationRoutes);
app.use("/api/v1/schedules", scheduleRoutes);
app.use("/api/v1/accounts", accountRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
