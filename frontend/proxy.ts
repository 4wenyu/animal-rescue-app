import { auth } from "./app/api/auth/[...nextauth]/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const session = await auth();

  const protectedPaths = ["/dashboard", "/intake", "/medical"];
  // Tier 0.4: the citizen intake portal (/intake/public) is PUBLIC — an
  // anonymous community member reporting a stray or surrendering their pet
  // must NOT be forced to log in. It is excluded from the auth gate.
  const publicPaths = ["/intake/public"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isProtected && !isPublicPath && !session?.user) {
    const redirectUrl = new URL("/login", request.nextUrl.origin);
    redirectUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/intake/:path*", "/medical/:path*"],
};