import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { randomUUID, randomBytes } from "node:crypto";
import { fetchOne, fetchAll, exec } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
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
      const ok = await bcrypt.compare(password, row.password_hash);
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
      if (account?.provider === "google") {
        const existing = await fetchOne<UserRow>(
          "SELECT id, provider FROM users WHERE email = $1",
          [email],
        );
        if (!existing) {
          await exec(
            "INSERT INTO users (id, email, name, image, provider) VALUES ($1, $2, $3, $4, $5)",
            [randomUUID(), email, user.name ?? null, user.image ?? null, "google"],
          );
        } else if (!/google/.test(existing.provider)) {
          await exec(
            "UPDATE users SET provider = provider || ',google' WHERE id = $1",
            [existing.id],
          );
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const row = await fetchOne<UserRow>(
          "SELECT id, name, image FROM users WHERE email = $1",
          [user.email.toLowerCase()],
        );
        if (row) {
          token.uid = row.id;
          token.name = row.name ?? undefined;
          token.picture = row.image ?? undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid as string;
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
  created_at: number | null;
};
