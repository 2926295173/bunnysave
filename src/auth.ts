import NextAuth, { type DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { randomUUID, randomBytes } from "node:crypto";
import { fetchOne, fetchAll, exec } from "@/lib/db";

/**
 * Hash the user-entered password with MD5 before bcrypt-comparing.
 * The DB stores `bcrypt(md5(plaintext))`; matching the same pipeline at
 * login keeps the round-trip symmetric. See scripts/ensure-admin.ts for
 * the matching writer.
 */
function fingerprint(password: string): string {
  return createHash("md5").update(password, "utf8").digest("hex");
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: "user" | "admin";
  }
}

const SECRET =
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-only-secret-change-me";

const providers = [
  Credentials({
    id: "credentials",
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const email = String(raw?.email ?? "").toLowerCase().trim();
      const password = String(raw?.password ?? "");
      if (!email || !password) return null;
      const row = await fetchOne<UserRow>(
        "SELECT id, email, name, password_hash FROM users WHERE email = $1",
        [email],
      );
      if (!row || !row.password_hash) return null;
      const ok = await bcrypt.compare(fingerprint(password), row.password_hash);
      if (!ok) return null;
      return { id: row.id, email: row.email, name: row.name ?? undefined };
    },
  }),
  Credentials({
    id: "magic-link",
    name: "Magic Link",
    credentials: { email: { label: "Email", type: "email" } },
    async authorize(raw) {
      const email = String(raw?.email ?? "").toLowerCase().trim();
      if (!email) return null;
      const row = await fetchOne<UserRow>("SELECT id, email, name FROM users WHERE email = $1", [
        email,
      ]);
      if (!row) return null;
      return { id: row.id, email: row.email, name: row.name ?? undefined };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (providers as any[]).push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false;
      const email = user.email.toLowerCase();

      // Auto-promote to admin if the email is in ADMIN_EMAILS. The check runs
      // on every sign-in so the env var is consulted dynamically (no restart
      // needed to grant admin).
      const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const shouldBeAdmin = adminEmails.includes(email);

      const existing = await fetchOne<UserRow>(
        "SELECT id, role FROM users WHERE email = $1",
        [email],
      );
      if (!existing) {
        await exec(
          "INSERT INTO users (id, email, name, image, provider, role) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            randomUUID(),
            email,
            user.name ?? null,
            user.image ?? null,
            account?.provider ?? "credentials",
            shouldBeAdmin ? "admin" : "user",
          ],
        );
      } else if (shouldBeAdmin && existing.role !== "admin") {
        await exec("UPDATE users SET role = 'admin' WHERE id = $1", [existing.id]);
      } else if (!shouldBeAdmin && account?.provider === "google" && !/google/.test(account.provider)) {
        // keep existing provider tag, no-op
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const row = await fetchOne<UserRow>(
          "SELECT id, name, image, role FROM users WHERE email = $1",
          [user.email.toLowerCase()],
        );
        if (row) {
          token.uid = row.id;
          token.name = row.name ?? undefined;
          token.picture = row.image ?? undefined;
          token.role = (row.role as "user" | "admin") ?? "user";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid as string;
        session.user.role = (token.role as "user" | "admin") ?? "user";
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
});

// ----- Magic Link helpers (called from our own API routes) -----

export async function createMagicLink(
  email: string,
): Promise<{ token: string; expiresAt: number }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 15; // 15 min
  await exec(
    "INSERT INTO magic_links (token, email, expires_at) VALUES ($1, $2, $3)",
    [token, email.toLowerCase(), expiresAt],
  );
  return { token, expiresAt };
}

export async function consumeMagicLink(token: string): Promise<{ email: string } | null> {
  const now = Math.floor(Date.now() / 1000);
  const row = await fetchOne<{ email: string; consumed_at: number | null }>(
    "SELECT email, consumed_at FROM magic_links WHERE token = $1 AND expires_at > $2",
    [token, now],
  );
  if (!row || row.consumed_at) return null;
  await exec("UPDATE magic_links SET consumed_at = $1 WHERE token = $2", [now, token]);
  return { email: row.email };
}

export async function findOrCreateUserByEmail(email: string): Promise<UserRow> {
  const normalized = email.toLowerCase();
  const existing = await fetchOne<UserRow>(
    "SELECT id, email, name, image, password_hash, provider, created_at::bigint AS created_at FROM users WHERE email = $1",
    [normalized],
  );
  if (existing) return existing;
  const id = randomUUID();
  await exec("INSERT INTO users (id, email, provider) VALUES ($1, $2, $3)", [
    id,
    normalized,
    "magic-link",
  ]);
  const row = await fetchOne<UserRow>(
    "SELECT id, email, name, image, password_hash, provider, created_at::bigint AS created_at FROM users WHERE id = $1",
    [id],
  );
  if (!row) throw new Error("failed to create magic-link user");
  return row;
}

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  password_hash: string | null;
  provider: string;
  role: "user" | "admin";
  created_at: number | null;
};
