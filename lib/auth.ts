import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

const isV0Iframe = Boolean(
  process.env.V0_RUNTIME_URL ||
    process.env.V0_DEV_APP_URL ||
    process.env.V0_BUILD_URL ||
    process.env.V0_SANDBOX_URL
)

const isProduction = process.env.NODE_ENV === 'production'

const baseURL =
  process.env.BETTER_AUTH_URL ??
  (isProduction
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined
    : isV0Iframe
    ? process.env.V0_RUNTIME_URL ??
      process.env.V0_DEV_APP_URL ??
      process.env.V0_BUILD_URL ??
      process.env.V0_SANDBOX_URL
    : 'http://localhost:3000')

export const auth = betterAuth({
  database: pool,
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
  },
  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development' && !isV0Iframe
      ? ['http://localhost:3000']
      : []),
    ...(isV0Iframe
      ? [
          process.env.V0_RUNTIME_URL,
          process.env.V0_DEV_APP_URL,
          process.env.V0_BUILD_URL,
          process.env.V0_SANDBOX_URL,
        ]
            .filter(Boolean)
            .map((u) => u!.replace(/\/$/, ''))
      : []),
    ...(isProduction
      ? [
          ...(process.env.VERCEL_URL
            ? [`https://${process.env.VERCEL_URL}`]
            : []),
          ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
            : []),
          ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  advanced: {
    defaultCookieAttributes: isV0Iframe
      ? {
          sameSite: 'none',
          secure: true,
          httpOnly: true,
        }
      : isProduction
      ? {
          sameSite: 'lax',
          secure: true,
          httpOnly: true,
        }
      : {
          sameSite: 'lax',
          secure: false,
          httpOnly: true,
        },
  },
})
