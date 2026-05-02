import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword, requireOwner } from "./authHelpers";

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email || args.password.length < 6) {
      throw new Error("Use a valid email and a password with at least 6 characters");
    }

    const existing = await ctx.db
      .query("owners")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      throw new Error("Owner account already exists");
    }

    const ownerId = await ctx.db.insert("owners", {
      name: args.name.trim() || "Owner",
      email,
      passwordHash: await hashPassword(args.password),
      createdAt: Date.now(),
    });

    return await ctx.db.insert("sessions", {
      ownerId,
      createdAt: Date.now(),
    });
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const owner = await ctx.db
      .query("owners")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .unique();

    if (!owner || owner.passwordHash !== (await hashPassword(args.password))) {
      throw new Error("Invalid email or password");
    }

    return await ctx.db.insert("sessions", {
      ownerId: owner._id,
      createdAt: Date.now(),
    });
  },
});

export const viewer = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return null;
    }

    const owner = await ctx.db.get(session.ownerId);
    if (!owner) {
      return null;
    }

    return {
      _id: owner._id,
      name: owner.name,
      email: owner.email,
    };
  },
});
