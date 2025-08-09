import { Router } from "express";
import {
  getUserDetailsById,
  updateUserDetails,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Secure all user routes
router.use(verifyJWT);

router.get("/get", getUserDetailsById);
router.post("/update", updateUserDetails);

export default router;
