import { Router } from "express";
import { requireAuth } from "@/core/auth/middleware/requireAuth";
import { asyncHandler } from "@/core/utils/asyncHandler";
import { FeedbackController } from "@/modules/admin/controllers/feedback.controller";

const router = Router();

router.post("/", requireAuth, asyncHandler(FeedbackController.submitFeedback));

export const feedbackRouter = router;
export default router;
