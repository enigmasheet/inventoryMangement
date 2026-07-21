import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const log = createLogger("auth");

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!googleClientId || !googleClientSecret) {
  log.warn("Google OAuth credentials not configured — sign-in will fail");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  socialProviders: {
    google: {
      clientId: googleClientId ?? "",
      clientSecret: googleClientSecret ?? "",
    },
  },
  user: {
    additionalFields: {
      tenantId: { type: "string", required: false },
    },
  },
})
