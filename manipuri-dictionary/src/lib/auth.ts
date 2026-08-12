import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { User } from "next-auth";
import { prisma } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase();

        try {
          const user = await prisma.$queryRaw<
            Array<{
              id: number;
              name: string;
              email: string;
              password_hash: string;
              role: string;
              status: string;
            }>
          >`
            SELECT id, name, email, password_hash, role, status
            FROM users
            WHERE email = ${email}
            LIMIT 1
          `;

          if (!user[0] || user[0].status !== "active") {
            return null;
          }

          const valid = await bcrypt.compare(
            String(credentials.password),
            user[0].password_hash
          );

          if (!valid) {
            return null;
          }

          return {
            id: user[0].id.toString(),
            name: user[0].name,
            email: user[0].email,
            role: user[0].role,
          } as User & { role: string };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as User & { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET,
});