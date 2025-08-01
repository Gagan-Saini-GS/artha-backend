import { Router } from "express";
import {
  createTransaction,
  getRecentTransactions,
  getTransactionById,
  deleteTransaction,
  getTransactionHistory,
} from "../controllers/transaction.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/zod.middleware.js";
import { createTransactionSchema } from "../zod-schemas/transaction.schema.js";

const router = Router();

// Secure all transaction routes
router.use(verifyJWT);

router.post("/add", validate(createTransactionSchema), createTransaction);

router.get("/recent", getRecentTransactions);

router.get("/history", getTransactionHistory);

router.get("/:id", getTransactionById);

router.delete("/:id", deleteTransaction);

export default router;
