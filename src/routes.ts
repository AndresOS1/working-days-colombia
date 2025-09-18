import { Router } from "express";
import { getWorkingDate } from "./controllers/workingDateController.js";
import { healthCheck, helloWorld } from "./controllers/healthController.js";

const router = Router();

router.get("/", helloWorld);
router.get("/health", healthCheck);
router.get("/working-date", getWorkingDate);

export default router;
