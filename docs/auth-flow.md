# Authentication & Authorization Flow

## Overview

Authentication is handled by **Better Auth** with **Google OAuth** as the sole provider. The system uses a three-layer defense-in-depth model for authorization. Users sign in with Google, create or join a shop (tenant), and are then scoped to that tenant for all operations.

## Better Auth Configuration

The auth instance is configured in `src/lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/db"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      tenantId: { type: "string", required: false },
    },
  },
})
```

Key points:
- Uses Prisma adapter; Session/Account/Verification models are auto-managed (hand-written as a workaround due to a Better Auth CLI version mismatch)
- `tenantId` is an additional field on the User model — this is the only custom field
- The auth handler at `src/app/api/auth/[...all]/route.ts` delegates to this instance

## Google OAuth Setup

### Google Cloud Console (one-time)

1. Create a project at https://console.cloud.google.com
2. Enable the Google+ API / OAuth consent screen
3. Create OAuth 2.0 credentials (Web application type)
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://your-domain.vercel.app/api/auth/callback/google` (prod)
5. Copy Client ID and Client Secret

### Environment Variables

```env
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxx
BETTER_AUTH_SECRET=openssl rand -hex 32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`NEXT_PUBLIC_APP_URL` is used in the client-side auth client (`sign-in-button.tsx`, `sign-out-button.tsx`) to avoid hardcoded localhost URLs.

## Auth Flow

### Sign In

```
User clicks "Sign in with Google"
        │
        ▼
createAuthClient().signIn.social({ provider: "google", callbackURL: "/" })
        │
        ▼
Browser redirects to Google OAuth consent screen
        │
        ▼
User grants consent
        │
        ▼
Google redirects to /api/auth/callback/google
        │
        ▼
Better Auth:
  1. Validates the OAuth code
  2. Creates/updates User, Account, Session records
  3. Sets session cookie
        │
        ▼
Browser redirects to callbackURL ("/")
        │
        ▼
Landing page renders, proxy.ts checks session
```

### Session Reading (Server-Side)

```typescript
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const session = await auth.api.getSession({ headers: await headers() });
```

The session object (when authenticated):
```typescript
{
  user: {
    id: "cm8...",
    email: "user@gmail.com",
    name: "User Name",
    image: "https://...",
    emailVerified: true,
    tenantId: "cm7..." | null,  // null if user hasn't created/joined a shop
  },
  session: {
    id: "cm9...",
    token: "...",
    expiresAt: Date,
  }
}
```

### Sign Out

```typescript
const authClient = createAuthClient({ baseURL });
await authClient.signOut();
window.location.href = "/";
```

## Tenant Scoping Flow

### 1. Proxy Layer (optimistic)

```typescript
export default async function proxy(request: Request) {
  // Skip _next and api routes
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}
```

- Only checks if a session exists
- Does NOT check tenant membership
- **This layer alone is not sufficient** (CVE-2025-29927)

### 2. Layout Layer (real security boundary)

```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user.tenantId) redirect("/");

const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
if (!tenant || tenant.id !== session.user.tenantId) redirect("/");
```

- Checks that user has a `tenantId`
- Checks that the URL's tenant slug matches the user's tenant
- Redirects to `/` on any mismatch

### 3. Server Action Layer (independent verification)

```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user.tenantId) return { error: "Unauthorized" };

// Every query scoped by session tenantId
const product = await prisma.product.findFirst({
  where: { id: productId, tenantId: session.user.tenantId },
});
if (!product) return { error: "Not found" };
```

- Each action re-reads the session independently
- Every query uses `findFirst` with `tenantId` (never `findUnique` alone)
- Cross-tenant access returns "Not found" (404 behavior)

## Shop Creation Flow

### Step-by-step

```
1. User signs in with Google (no tenantId)
2. User sees landing page → "Create Shop" button
3. User fills shop name + category → submits form
4. Server Action (createShop):
   a. Verifies session
   b. Validates input with Zod
   c. Slugifies shop name (appends random suffix if collision)
   d. Creates Tenant record
   e. Updates user's tenantId
   f. Redirects to /[slug]/dashboard
5. User is now scoped to their tenant
```

### Slug Collision Handling

```typescript
const slug = slugify(parsed.data.shopName, { lower: true, strict: true });
const existing = await prisma.tenant.findUnique({ where: { slug } });
if (existing) {
  slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
}
```

## Important Notes

- **Better Auth CLI version mismatch**: The `better-call` package is pinned to `1.3.6` because Better Auth resolves `better-call@1.1.8` which lacks `kAPIErrorHeaderSymbol`. Session/Account/Verification models were hand-written as a workaround rather than auto-generated.
- **No email/password auth**: Google OAuth is the only provider.
- **One user, one tenant**: Currently, a user can belong to only one tenant. This is by design for the MVP.
- **Session cookie**: Better Auth manages its own session cookie; no manual cookie handling needed.
