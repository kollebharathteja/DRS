import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireOwner } from "./authHelpers";

export const listForOwner = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx, args.sessionId);
    return await ctx.db
      .query("reviews")
      .withIndex("by_owner", (q) => q.eq("ownerId", owner._id))
      .order("desc")
      .collect();
  },
});

export const submit = mutation({
  args: {
    formId: v.id("forms"),
    studentName: v.string(),
    contactNumber: v.string(),
    email: v.string(),
    trainerName: v.string(),
    presentationQuality: v.string(),
    questionAnswers: v.array(v.object({ question: v.string(), rating: v.number() })),
    suggestions: v.string(),
  },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.formId);
    if (!form || form.status !== "published") {
      throw new Error("This form is not accepting reviews");
    }

    if (!args.suggestions.trim()) {
      throw new Error("Suggestions are required");
    }

    for (const answer of args.questionAnswers) {
      if (answer.rating < 1 || answer.rating > 5) {
        throw new Error("Each question rating must be between 1 and 5");
      }
    }

    await ctx.db.insert("reviews", {
      ownerId: form.ownerId,
      formId: args.formId,
      studentName: args.studentName.trim(),
      contactNumber: args.contactNumber.trim(),
      email: args.email.trim(),
      trainerName: args.trainerName.trim(),
      presentationQuality: args.presentationQuality,
      questionAnswers: args.questionAnswers,
      suggestions: args.suggestions.trim(),
      feedback: [],
      submittedAt: Date.now(),
    });
  },
});

export const removeExported = mutation({
  args: {
    sessionId: v.id("sessions"),
    reviewIds: v.array(v.id("reviews")),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx, args.sessionId);

    for (const reviewId of args.reviewIds) {
      const review = await ctx.db.get(reviewId);
      if (review && review.ownerId === owner._id) {
        await ctx.db.delete(reviewId);
      }
    }
  },
});
