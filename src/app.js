// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import swaggerUi from "swagger-ui-express";
// import swaggerJsdoc from "swagger-jsdoc";

// const app = express();

// app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
// app.use(express.json({ limit: "16kb" }));
// app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// app.use(cookieParser());

// // --- Swagger API Docs Setup ---
// const swaggerOptions = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "Artha - Expense Tracker API",
//       version: "1.0.0",
//       description:
//         "REST API for the Artha Flutter App, built with Express.js, Prisma, and Supabase.",
//     },
//     servers: [{ url: `http://localhost:${process.env.PORT || 8000}` }],
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: "http",
//           scheme: "bearer",
//           bearerFormat: "JWT",
//         },
//       },
//     },
//     security: [{ bearerAuth: [] }],
//   },
//   apis: ["./src/routes/*.js"],
// };

// const swaggerSpec = swaggerJsdoc(swaggerOptions);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// // --- Routes ---
// import authRouter from "./routes/auth.routes.js";
// import transactionRouter from "./routes/transaction.routes.js";

// app.use("/auth", authRouter);
// app.use("/transactions", transactionRouter);

// // Health check
// app.get("/", (req, res) =>
//   res
//     .status(200)
//     .send("Artha Backend API is healthy! 🚀 Visit /api-docs for documentation.")
// );

// // Global error handler
// import { ApiError } from "./utils/ApiError.js";
// app.use((err, req, res, next) => {
//   if (err instanceof ApiError) {
//     return res.status(err.statusCode).json({
//       success: false,
//       message: err.message,
//       errors: err.errors,
//     });
//   }
//   console.error(err); // Log unexpected errors
//   return res.status(500).json({
//     success: false,
//     message: "Internal Server Error",
//   });
// });

// export { app };

// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import swaggerUi from "swagger-ui-express";
// import swaggerJsdoc from "swagger-jsdoc";
// import dotenv from "dotenv";
// import connectDB from "./db/index.js"; // <-- your DB connection helper

// // Load env vars
// dotenv.config();

// const app = express();

// // Connect DB on cold start
// await connectDB();

// app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
// app.use(express.json({ limit: "16kb" }));
// app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// app.use(cookieParser());

// // --- Swagger API Docs Setup ---
// const swaggerOptions = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "Artha - Expense Tracker API",
//       version: "1.0.0",
//       description:
//         "REST API for the Artha Flutter App, built with Express.js, Prisma, and Supabase.",
//     },
//     servers: [{ url: `http://localhost:${process.env.PORT || 8000}` }],
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: "http",
//           scheme: "bearer",
//           bearerFormat: "JWT",
//         },
//       },
//     },
//     security: [{ bearerAuth: [] }],
//   },
//   apis: ["./src/routes/*.js"],
// };

// const swaggerSpec = swaggerJsdoc(swaggerOptions);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// // --- Routes ---
// import authRouter from "./routes/auth.routes.js";
// import transactionRouter from "./routes/transaction.routes.js";

// app.use("/auth", authRouter);
// app.use("/transactions", transactionRouter);

// // Health check
// app.get("/", (req, res) =>
//   res
//     .status(200)
//     .send("Artha Backend API is healthy! 🚀 Visit /api-docs for documentation.")
// );

// // Global error handler
// import { ApiError } from "./utils/ApiError.js";
// app.use((err, req, res, next) => {
//   if (err instanceof ApiError) {
//     return res.status(err.statusCode).json({
//       success: false,
//       message: err.message,
//       errors: err.errors,
//     });
//   }
//   console.error(err); // Log unexpected errors
//   return res.status(500).json({
//     success: false,
//     message: "Internal Server Error",
//   });
// });

// export { app };

// GEMINI FIX

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// import swaggerUi from "swagger-ui-express";
// import swaggerJsdoc from "swagger-jsdoc";

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

// --- Swagger API Docs Setup ---
// const swaggerOptions = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "Artha - Expense Tracker API",
//       version: "1.0.0",
//       description:
//         "REST API for the Artha Flutter App, built with Express.js, Prisma, and Supabase.",
//     },
//     servers: [{ url: `http://localhost:${process.env.PORT || 8000}` }],
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: "http",
//           scheme: "bearer",
//           bearerFormat: "JWT",
//         },
//       },
//     },
//     security: [{ bearerAuth: [] }],
//   },
//   apis: ["./src/routes/*.js"],
// };

// const swaggerSpec = swaggerJsdoc(swaggerOptions);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

// API root endpoint
app.get("/api", (req, res) =>
  res.status(200).json({
    success: true,
    message: "Artha Backend API is running! 🚀",
    endpoints: {
      auth: "/auth",
      transactions: "/transactions",
      health: "/",
    },
  })
);

// Catch-all for /api/* routes that don't match specific endpoints
app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.path} not found`,
    availableEndpoints: {
      apiRoot: "GET /api",
      auth: "POST /auth/register, POST /auth/login, etc.",
      transactions: "GET /transactions, POST /transactions, etc.",
      health: "GET /",
    },
  });
});

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

export { app };
