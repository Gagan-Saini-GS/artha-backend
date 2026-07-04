import { Router } from "express";
import {
  signup,
  login,
  logout,
  refreshAccessToken,
} from "../controllers/auth.controller.js";
import { validate } from "../middleware/zod.middleware.js";
import {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
} from "../zod-schemas/auth.schema.js";

const router = Router();

// v1 routes
router.post("/signup/v1", validate(signupSchema), signup);

router.post("/login/v1", validate(loginSchema), login);

router.post("/refresh/v1", validate(refreshTokenSchema), refreshAccessToken);

router.post("/logout/v1", validate(refreshTokenSchema), logout);

export default router;
