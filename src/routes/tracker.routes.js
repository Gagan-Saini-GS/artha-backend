import { Router } from "express";
import {
  createTracker,
  getTrackers,
  searchTrackers,
  getTrackerById,
  deleteTracker,
} from "../controllers/tracker.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/zod.middleware.js";
import {
  createTrackerSchema,
  trackerIdParamSchema,
} from "../zod-schemas/tracker.schema.js";

const router = Router();

// Secure all tracker routes
router.use(verifyJWT);

router.post("/add/v1", validate(createTrackerSchema), createTracker);

router.get("/get/v1", getTrackers);

router.get("/search/v1", searchTrackers);

router.get(
  "/details/v1/:id",
  validate(trackerIdParamSchema),
  getTrackerById,
);

router.delete(
  "/delete/v1/:id",
  validate(trackerIdParamSchema),
  deleteTracker,
);

export default router;
