import { Router } from "express";
import { sendContactMessage } from "../controllers/support.controller.js";

const router = Router();

router.post("/contact", sendContactMessage);

export default router;