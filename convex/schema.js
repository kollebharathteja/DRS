import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  owners: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    ownerId: v.id("owners"),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  forms: defineTable({
    ownerId: v.id("owners"),
    title: v.string(),
    trainerName: v.string(),
    presentationPrompt: v.string(),
    expectationPrompt: v.string(),
    questions: v.optional(v.array(v.object({ text: v.string() }))),
    feedbackOptions: v.array(v.string()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  reviews: defineTable({
    ownerId: v.id("owners"),
    formId: v.id("forms"),
    studentName: v.string(),
    contactNumber: v.string(),
    email: v.string(),
    trainerName: v.string(),
    presentationQuality: v.string(),
    rating: v.optional(v.number()),
    feedbackRating: v.optional(v.number()),
    questionAnswers: v.optional(v.array(v.object({ question: v.string(), rating: v.number() }))),
    suggestions: v.optional(v.string()),
    metExpectations: v.optional(v.boolean()),
    feedback: v.array(v.string()),
    submittedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_form", ["formId"]),
});
