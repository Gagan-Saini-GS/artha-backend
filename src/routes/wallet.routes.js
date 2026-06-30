import { Router } from "express";
import { getWalletDetailsByUserId } from "../controllers/wallet.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/details", getWalletDetailsByUserId);

export default router;
