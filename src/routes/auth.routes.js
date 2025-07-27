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

router.post("/signup", validate(signupSchema), signup);

router.post("/login", validate(loginSchema), login);

router.post("/refresh", validate(refreshTokenSchema), refreshAccessToken);

router.post("/logout", validate(refreshTokenSchema), logout);

export default router;
