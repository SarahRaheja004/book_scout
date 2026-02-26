import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute window
  limit: 60,               // 60 req/min per IP
  standardHeaders: true,
  legacyHeaders: false
});