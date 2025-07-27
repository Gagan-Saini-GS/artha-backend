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

/**
 * @swagger
 * /api/v1/auth/signup:
 * post:
 * summary: Register a new user
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [name, email, password]
 * properties:
 * name: { type: string }
 * email: { type: string, format: email }
 * password: { type: string, format: password, minLength: 6 }
 * currency: { type: string, default: 'INR' }
 * responses:
 * 201:
 * description: User created successfully
 * 409:
 * description: User already exists
 */
router.post("/signup", validate(signupSchema), signup);

/**
 * @swagger
 * /api/v1/auth/login:
 * post:
 * summary: Login a user
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [email, password]
 * properties:
 * email: { type: string, format: email }
 * password: { type: string }
 * responses:
 * 200:
 * description: Login successful, returns tokens
 * 401:
 * description: Invalid credentials
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 * post:
 * summary: Refresh an access token
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [refreshToken]
 * properties:
 * refreshToken: { type: string }
 * responses:
 * 200:
 * description: New access token generated
 * 401:
 * description: Invalid or expired refresh token
 */
router.post("/refresh", validate(refreshTokenSchema), refreshAccessToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 * post:
 * summary: Logout a user
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [refreshToken]
 * properties:
 * refreshToken: { type: string }
 * responses:
 * 200:
 * description: Logout successful
 */
router.post("/logout", validate(refreshTokenSchema), logout);

export default router;
