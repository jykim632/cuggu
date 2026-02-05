import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
// import bcrypt from "bcryptjs"; // 향후 비밀번호 검증 시 사용

export const authConfig = {
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
  }),
  providers: [
    // 카카오 로그인
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      checks: ["state"], // PKCE 비활성화 (카카오 호환성)
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.kakao_account?.profile?.nickname || null,
          email: profile.kakao_account?.email || null,
          image: profile.kakao_account?.profile?.profile_image_url || null,
        };
      },
    }),
    // 네이버 로그인
    Naver({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.response.id,
          name: profile.response.name || profile.response.nickname || null,
          email: profile.response.email || null,
          image: profile.response.profile_image || null,
        };
      },
    }),
    // 이메일/비밀번호 로그인
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

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user) {
          return null;
        }

        // 비밀번호 검증 (향후 구현)
        // const isValid = await bcrypt.compare(
        //   credentials.password as string,
        //   user.passwordHash
        // );
        // if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  cookies: {
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  callbacks: {
    async jwt({ token, user, trigger }) {
      // 최초 로그인 시 또는 업데이트 시 role 조회
      if (user || trigger === "update") {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.sub!),
          columns: { role: true },
        });
        token.role = dbUser?.role || "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as string) || "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
