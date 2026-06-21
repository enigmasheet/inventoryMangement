import { NextResponse } from "next/server";

const STATIC_SKIP = ["/_next", "/api/", "/sw.js", "/manifest.json", "/icons/"];

export default async function proxy(request: Request) {
  const url = new URL(request.url);
  if (STATIC_SKIP.some((p) => url.pathname.startsWith(p))) return NextResponse.next();
  return NextResponse.next();
}

export const config = {
  matcher: ["/:tenantSlug/:path*"],
};
