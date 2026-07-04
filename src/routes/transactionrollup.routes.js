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

router.get("/stats/v1", getStatistics);

router.get("/summary/v1", getSummary);

router.post("/rebuild/v1", rebuildTransactionRollups);

export default router;
