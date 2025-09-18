import { Router } from "express";
import { healthCheck, helloWorld } from "./controllers/healthController.js";

const router = Router();

router.get("/", helloWorld);
router.get("/health", healthCheck);

export default router;
