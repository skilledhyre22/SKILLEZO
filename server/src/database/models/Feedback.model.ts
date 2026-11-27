import mongoose, { Document, Schema } from "mongoose";

export type FeedbackType = "improvement" | "bug" | "feature";
export type FeedbackStatus = "new" | "reviewed" | "resolved";

export interface IFeedback extends Document {
  userId: string;
  userName: string;
  userEmail: string;
  type: FeedbackType;
  message: string;
  pagePath?: string;
  status: FeedbackStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: "Candidate" },
    userEmail: { type: String, default: "" },
    type: {
      type: String,
      enum: ["improvement", "bug", "feature"],
      default: "improvement",
      index: true,
    },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    pagePath: { type: String, default: "/dashboard" },
    status: {
      type: String,
      enum: ["new", "reviewed", "resolved"],
      default: "new",
      index: true,
    },
    adminNotes: { type: String, default: "", maxlength: 1500 },
  },
  { timestamps: true }
);

FeedbackSchema.index({ createdAt: -1 });

export const FeedbackModel =
  mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);
