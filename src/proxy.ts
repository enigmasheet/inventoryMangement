import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const STATIC_SKIP = ["/_next", "/api/"];

export default async function proxy(request: Request) {
  const url = new URL(request.url);
  if (STATIC_SKIP.some((p) => url.pathname.startsWith(p))) return NextResponse.next();

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:tenantSlug/:path*"],
};
