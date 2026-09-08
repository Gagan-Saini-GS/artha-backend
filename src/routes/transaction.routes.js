import { Router } from "express";
import {
  createTransaction,
  getRecentTransactions,
  getTransactionById,
  deleteTransaction,
  getTransactionHistory,
  getTransactionsByDateRange,
  searchTransaction,
  createTransaction2,
  getTransactionsByTrackerId,
} from "../controllers/transaction.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/zod.middleware.js";
import {
  createTransactionSchema,
  deleteTransactionSchema,
} from "../zod-schemas/transaction.schema.js";

const router = Router();

// Secure all transaction routes
router.use(verifyJWT);

router.post("/add/v1", validate(createTransactionSchema), createTransaction);

router.post("/add/v2", validate(createTransactionSchema), createTransaction2);

router.get("/recent/v1", getRecentTransactions);

router.get("/history/v1", getTransactionHistory);

router.get("/dates/v1", getTransactionsByDateRange);

router.get("/search/v1", searchTransaction);

router.get("/details/v1/:id", getTransactionById);

router.get("/tracker/v1/:id", getTransactionsByTrackerId);

router.delete(
  "/delete/v1/:id",
  validate(deleteTransactionSchema),
  deleteTransaction,
);

export default router;
