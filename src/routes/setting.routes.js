import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  getSettingsByUserId,
  updateSettingsByUserId,
} from "../controllers/setting.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/details/v1", getSettingsByUserId);
router.post("/update/v1", updateSettingsByUserId);

export default router;
