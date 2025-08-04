import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// --- Routes ---
import authRouter from "./routes/auth.routes.js";
import transactionRouter from "./routes/transaction.routes.js";

app.use("/auth", authRouter);
app.use("/transactions", transactionRouter);

// Health check
app.get("/", (req, res) =>
  res
    .status(200)
    .send("Artha Backend API is healthy! 🚀 Visit /api-docs for documentation.")
);

// Global error handler
import { ApiError } from "./utils/ApiError.js";
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }
  console.error(err); // Log unexpected errors
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

export default app;
