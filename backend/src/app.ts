import express from "express";
import searchRouter from "./routes/search.routes.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/search", searchRouter);

export default app;
