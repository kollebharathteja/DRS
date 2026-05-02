import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireOwner } from "./authHelpers";

export const listMine = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx, args.sessionId);
    return await ctx.db
      .query("forms")
      .withIndex("by_owner", (q) => q.eq("ownerId", owner._id))
      .order("desc")
      .collect();
  },
});

export const getPublic = query({
  args: {
    formId: v.id("forms"),
  },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.formId);
    if (!form || form.status !== "published") {
      return null;
    }

    return {
      _id: form._id,
      title: form.title,
      trainerName: form.trainerName,
      presentationPrompt: form.presentationPrompt,
      expectationPrompt: form.expectationPrompt,
      questions: form.questions ?? [
        { text: form.presentationPrompt },
        { text: form.expectationPrompt },
      ],
      feedbackOptions: form.feedbackOptions,
    };
  },
});

export const create = mutation({
  args: {
    sessionId: v.id("sessions"),
    title: v.string(),
    trainerName: v.string(),
    presentationPrompt: v.string(),
    expectationPrompt: v.string(),
    feedbackOptions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx, args.sessionId);
    const now = Date.now();
    return await ctx.db.insert("forms", {
      ownerId: owner._id,
      title: args.title,
      trainerName: args.trainerName,
      presentationPrompt: args.presentationPrompt,
      expectationPrompt: args.expectationPrompt,
      questions: [
        { text: "Is this good?" },
        { text: "Expectations reached?" },
      ],
      feedbackOptions: args.feedbackOptions,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    sessionId: v.id("sessions"),
    formId: v.id("forms"),
    title: v.string(),
    trainerName: v.string(),
    presentationPrompt: v.string(),
    expectationPrompt: v.string(),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx, args.sessionId);
    const form = await ctx.db.get(args.formId);
    if (!form || form.ownerId !== owner._id) {
      throw new Error("Form not found");
    }

    await ctx.db.patch(args.formId, {
      title: args.title,
      trainerName: args.trainerName,
      presentationPrompt: args.presentationPrompt,
      expectationPrompt: args.expectationPrompt,
      updatedAt: Date.now(),
    });
  },
});

export const publish = mutation({
  args: {
    sessionId: v.id("sessions"),
    formId: v.id("forms"),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx, args.sessionId);
    const form = await ctx.db.get(args.formId);
    if (!form || form.ownerId !== owner._id) {
      throw new Error("Form not found");
    }

    await ctx.db.patch(args.formId, {
      status: "published",
      updatedAt: Date.now(),
    });
  },
});

export const archive = mutation({
  args: {
    sessionId: v.id("sessions"),
    formId: v.id("forms"),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx, args.sessionId);
    const form = await ctx.db.get(args.formId);
    if (!form || form.ownerId !== owner._id) {
      throw new Error("Form not found");
    }

    await ctx.db.patch(args.formId, {
      status: "archived",
      updatedAt: Date.now(),
    });
  },
});

export const addFeedbackOption = mutation({
  args: {
    sessionId: v.id("sessions"),
    formId: v.id("forms"),
    option: v.string(),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx, args.sessionId);
    const form = await ctx.db.get(args.formId);
    if (!form || form.ownerId !== owner._id) {
      throw new Error("Form not found");
    }

    const option = args.option.trim();
    if (!option || form.feedbackOptions.includes(option)) return;

    await ctx.db.patch(args.formId, {
      feedbackOptions: [...form.feedbackOptions, option],
      updatedAt: Date.now(),
    });
  },
});

export const removeFeedbackOption = mutation({
  args: {
    sessionId: v.id("sessions"),
    formId: v.id("forms"),
    option: v.string(),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx, args.sessionId);
    const form = await ctx.db.get(args.formId);
    if (!form || form.ownerId !== owner._id) {
      throw new Error("Form not found");
    }

    await ctx.db.patch(args.formId, {
      feedbackOptions: form.feedbackOptions.filter((option) => option !== args.option),
      updatedAt: Date.now(),
    });
  },
});

export const addQuestion = mutation({
  args: {
    sessionId: v.id("sessions"),
    formId: v.id("forms"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx, args.sessionId);
    const form = await ctx.db.get(args.formId);
    if (!form || form.ownerId !== owner._id) {
      throw new Error("Form not found");
    }

    const question = args.question.trim();
    if (!question) return;

    await ctx.db.patch(args.formId, {
      questions: [...(form.questions ?? []), { text: question }],
      updatedAt: Date.now(),
    });
  },
});

export const removeQuestion = mutation({
  args: {
    sessionId: v.id("sessions"),
    formId: v.id("forms"),
    index: v.number(),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx, args.sessionId);
    const form = await ctx.db.get(args.formId);
    if (!form || form.ownerId !== owner._id) {
      throw new Error("Form not found");
    }

    const questions = form.questions ?? [];
    await ctx.db.patch(args.formId, {
      questions: questions.filter((_, index) => index !== args.index),
      updatedAt: Date.now(),
    });
  },
});
