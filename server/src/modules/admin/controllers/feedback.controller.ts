import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { FeedbackModel } from "@/database/models/Feedback.model";
import { successResponse, errorResponse } from "@/core/utils/apiResponse";
import { HTTP_STATUS } from "@/core/constants/http-status";

const createFeedbackSchema = z.object({
  type: z.enum(["improvement", "bug", "feature"]).default("improvement"),
  message: z.string().trim().min(3, "Feedback message is too short").max(3000),
  pagePath: z.string().trim().max(300).optional(),
});

const updateFeedbackSchema = z.object({
  status: z.enum(["new", "reviewed", "resolved"]).optional(),
  adminNotes: z.string().trim().max(1500).optional(),
});

export class FeedbackController {
  /**
   * POST /api/feedback
   * Authenticated user submits feedback from the dashboard footer
   */
  public static async submitFeedback(req: Request, res: Response): Promise<void> {
    const validated = createFeedbackSchema.parse(req.body);
    const user = (req as any).user || {};

    const created = await FeedbackModel.create({
      userId: user.id || user._id || "unknown",
      userName: user.name || "Candidate",
      userEmail: user.email || "",
      type: validated.type,
      message: validated.message,
      pagePath: validated.pagePath || "/dashboard",
      status: "new",
    });

    res.status(HTTP_STATUS.CREATED).json(successResponse(created));
  }

  /**
   * GET /api/admin/feedback
   * Admin lists user feedback with filters and status counts
   */
  public static async listFeedback(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const type = typeof req.query.type === "string" ? req.query.type.trim() : "";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    const filter: Record<string, any> = {};
    if (status && ["new", "reviewed", "resolved"].includes(status)) {
      filter.status = status;
    }
    if (type && ["improvement", "bug", "feature"].includes(type)) {
      filter.type = type;
    }
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ message: regex }, { userName: regex }, { userEmail: regex }, { pagePath: regex }];
    }

    const [items, total, statusGroups] = await Promise.all([
      FeedbackModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FeedbackModel.countDocuments(filter),
      FeedbackModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const counts: Record<string, number> = { new: 0, reviewed: 0, resolved: 0 };
    for (const g of statusGroups) {
      if (g._id in counts) counts[g._id] = g.count;
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse({
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
        summary: {
          total: counts.new + counts.reviewed + counts.resolved,
          new: counts.new,
          reviewed: counts.reviewed,
          resolved: counts.resolved,
        },
      })
    );
  }

  /**
   * PATCH /api/admin/feedback/:id
   * Admin updates feedback status or internal notes
   */
  public static async updateFeedback(req: Request, res: Response): Promise<void> {
    const validated = updateFeedbackSchema.parse(req.body);
    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse("BAD_REQUEST", "Invalid feedback ID"));
      return;
    }

    const updated = await FeedbackModel.findByIdAndUpdate(
      id,
      { $set: validated },
      { new: true }
    ).lean();

    if (!updated) {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("NOT_FOUND", "Feedback item not found"));
      return;
    }

    res.status(HTTP_STATUS.OK).json(successResponse(updated));
  }

  /**
   * DELETE /api/admin/feedback/:id
   * Admin deletes a feedback item
   */
  public static async deleteFeedback(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse("BAD_REQUEST", "Invalid feedback ID"));
      return;
    }

    const deleted = await FeedbackModel.findByIdAndDelete(id).lean();

    if (!deleted) {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("NOT_FOUND", "Feedback item not found"));
      return;
    }

    res.status(HTTP_STATUS.OK).json(successResponse({ deletedId: id }));
  }
}
