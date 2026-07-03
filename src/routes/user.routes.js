import { Router } from "express";
import {
  getUserDetailsById,
  updateUserDetails,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Secure all user routes
router.use(verifyJWT);

router.get("/get/v1", getUserDetailsById);
router.post("/update/v1", updateUserDetails);

export default router;
