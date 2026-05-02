export async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function requireOwner(ctx, sessionId) {
  const session = await ctx.db.get(sessionId);
  if (!session) {
    throw new Error("Login session expired");
  }

  const owner = await ctx.db.get(session.ownerId);
  if (!owner) {
    throw new Error("Owner account not found");
  }

  return owner;
}
