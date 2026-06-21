# Deployment Guide

## Overview

The application is designed to deploy on **Vercel** (frontend + Server Actions) with **Neon** or **Supabase** (PostgreSQL). The same codebase runs in development with Docker PostgreSQL.

## Prerequisites

- Vercel account (Hobby tier is sufficient)
- Neon or Supabase project (free tier)
- Google OAuth credentials (Web application type)
- `node: 20.9+` (required by Next.js 16)

## Environment Variables

### Required

| Variable | Description | Source |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Neon/Supabase dashboard |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Google Cloud Console |
| `BETTER_AUTH_SECRET` | Encryption secret (32+ hex chars) | Generate with `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Deployment URL | e.g., `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Client-side base URL | Same as `BETTER_AUTH_URL` |

### Optional

| Variable | Default | Description |
|---|---|---|
| `LOG_LEVEL` | `silent` | Server-side logging level (`debug`, `info`, `warn`, `error`, `silent`) |

## Step-by-Step Deployment

### 1. Database (Neon)

1. Create a Neon project at https://neon.tech
2. Copy the connection string from the dashboard
3. It looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/inventory?sslmode=require`

### 2. Google OAuth — Update Redirect URIs

In Google Cloud Console → Credentials → Your OAuth 2.0 Web Client:

Add to Authorized redirect URIs:
```
https://your-app.vercel.app/api/auth/callback/google
```

### 3. Vercel

1. Push your repository to GitHub
2. Import the project in Vercel
3. Set the Framework Preset to **Next.js**
4. Add all environment variables from the table above
5. Build Command: `pnpm next build` (or leave default)
6. Deploy

### 4. Database Migrations

After the first deploy, run migrations:

```sh
# Using Vercel CLI or a one-off script
pnpm prisma migrate deploy
# Or connect to Neon via psql and run migrations manually
```

Or add a post-deploy script (recommended for production):

```sh
# Run from CI/CD or manually after deploy
npx prisma migrate deploy
```

### 5. Verify

1. Visit `https://your-app.vercel.app`
2. Sign in with Google
3. Create a shop
4. Test all features

## Production Considerations

### Database Connection Pooling

Neon uses PgBouncer internally. Prisma 7 with the driver adapter supports connection pooling via `?pgbouncer=true&connection_limit=1` in the connection string.

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/inventory?sslmode=require&pgbouncer=true&connection_limit=1
```

If you encounter connection issues in production, add the `connection_limit` parameter.

### Better Auth URL

The `BETTER_AUTH_URL` must match the exact deployment URL, including the protocol. For Vercel preview deployments, update this value in each environment.

### Build Verification

Build passes in ~10s with Turbopack on the development machine. On Vercel, the build will take longer due to cold starts.

```sh
pnpm next build
```

A successful build should show:
```
✓ Compiled successfully in ~9s
✓ Generating static pages (5/5)
```

### Linting

```sh
pnpm eslint .
```

Note: `next lint` is removed in Next.js 16; use ESLint directly.

## Vercel-Specific Notes

- **Proxy**: The `proxy.ts` file (which replaces `middleware.ts`) works identically on Vercel
- **Server Actions**: No additional configuration needed — they are serverless functions in Vercel
- **API Routes**: The CSV export routes are serverless functions; ensure they handle cold starts gracefully (they do — no heavy initialization beyond Prisma client)
- **Turbopack**: Vercel builds use Turbopack, which requires the top-level `turbopack` key in `next.config.ts` (not `experimental.turbopack`)

## `.env.example`

```env
# Database
DATABASE_URL=postgresql://invuser:invpass@localhost:5433/inventory

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Better Auth
BETTER_AUTH_SECRET=your_random_secret
BETTER_AUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=silent
```

## Troubleshooting

### "Not found" errors on every page

Check that `BETTER_AUTH_URL` in production matches your actual domain.

### Google OAuth redirects to localhost in production

Update the Authorized redirect URIs in Google Cloud Console and ensure `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` are correct.

### Prisma client generation fails on Vercel

Ensure `postinstall` script is present in `package.json`:
```json
"postinstall": "prisma generate"
```

### Connection timeout to database

- Verify Neon/Supabase allows connections from Vercel's IP range
- Add `?sslmode=require` to the connection string
- Check if connection pooling is needed (`?pgbouncer=true&connection_limit=1`)

## Rollback

1. Vercel: Go to the deployment dashboard → select a previous deployment → "Promote to Production"
2. Database: Use `prisma migrate diff` to generate a down migration, or restore from Neon/Supabase backup

## Monitoring

- **Vercel Analytics** — page views, serverless function errors, speed insights
- **Neon** — database CPU, connections, query performance
- **Better Auth** — check session and user counts via Prisma Studio on the production database
