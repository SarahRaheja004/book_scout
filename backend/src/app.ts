import express from "express";
import searchRouter from "./routes/search.routes.js";
import { apiLimiter } from "./middleware/rateLimit.js";

const app = express();

app.use(express.json());

// rate limit all API routes
app.use("/api", apiLimiter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/search", searchRouter);

export default app;