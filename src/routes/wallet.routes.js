import { Router } from "express";
import { getWalletDetailsByUserId } from "../controllers/wallet.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/details/v1", getWalletDetailsByUserId);

export default router;
