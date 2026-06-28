import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  getStatistics,
  getSummary,
  rebuildTransactionRollups,
} from "../controllers/transactionrollup.controller.js";

const router = Router();

// Secure all transaction rollup routes

router.use(verifyJWT);

router.get("/stats", getStatistics);

router.get("/summary", getSummary);

router.post("/rebuild", rebuildTransactionRollups);

export default router;
