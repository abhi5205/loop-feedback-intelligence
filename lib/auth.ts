import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

function getRedactedDbTarget(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "NOT_SET";
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//[REDACTED]@${parsed.host}${parsed.pathname}?${parsed.searchParams.toString()}`;
  } catch {
    return "SET (invalid URL format)";
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@company.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH_DIAGNOSTIC] authorize() invoked");
        console.log("[AUTH_DIAGNOSTIC] DATABASE_URL state:", process.env.DATABASE_URL ? "EXISTS" : "MISSING");
        console.log("[AUTH_DIAGNOSTIC] DB Target (Redacted):", getRedactedDbTarget());
        console.log("[AUTH_DIAGNOSTIC] NEXTAUTH_SECRET state:", process.env.NEXTAUTH_SECRET ? "EXISTS" : "MISSING (using fallback)");
        console.log("[AUTH_DIAGNOSTIC] NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "NOT_SET (Vercel automatic)");

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH_DIAGNOSTIC] Result: Missing credentials input");
          return null;
        }

        const targetEmail = credentials.email.toLowerCase().trim();
        const domain = targetEmail.includes("@") ? `@${targetEmail.split("@")[1]}` : "invalid";
        console.log(`[AUTH_DIAGNOSTIC] Querying email domain: ${domain}`);

        try {
          const user = await prisma.user.findUnique({
            where: { email: targetEmail },
            include: { workspace: true },
          });

          if (!user) {
            console.log("[AUTH_DIAGNOSTIC] User query result: USER_NOT_FOUND");
            return null;
          }

          console.log("[AUTH_DIAGNOSTIC] User query result: USER_FOUND");
          console.log("[AUTH_DIAGNOSTIC] Has passwordHash:", !!user.passwordHash);

          if (!user.passwordHash) {
            console.log("[AUTH_DIAGNOSTIC] Result: Missing passwordHash");
            return null;
          }

          console.log("[AUTH_DIAGNOSTIC] Reaching bcrypt.compare()");
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          console.log("[AUTH_DIAGNOSTIC] bcrypt.compare() result:", isValid ? "MATCH" : "MISMATCH");

          if (!isValid) {
            return null;
          }

          console.log("[AUTH_DIAGNOSTIC] Authentication SUCCESSFUL");
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            workspaceId: user.workspaceId,
            workspaceName: user.workspace?.name || "Workspace",
          };
        } catch (err: any) {
          console.error("[AUTH_DIAGNOSTIC] Prisma DB Query Error:", err?.message || err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as {
          id: string;
          email: string;
          name?: string;
          role: string;
          workspaceId: string;
          workspaceName: string;
        };
        token.id = u.id;
        token.role = u.role;
        token.workspaceId = u.workspaceId;
        token.workspaceName = u.workspaceName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).workspaceId = token.workspaceId;
        (session.user as any).workspaceName = token.workspaceName;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-fallback-secret-loop-min-32-chars-long",
};
