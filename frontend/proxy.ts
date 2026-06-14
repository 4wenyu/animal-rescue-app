import { auth } from "./app/api/auth/[...nextauth]/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const session = await auth();

  const protectedPaths = ["/dashboard", "/intake", "/medical"];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isProtected && !session?.user) {
    const redirectUrl = new URL("/login", request.nextUrl.origin);
    redirectUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/intake/:path*", "/medical/:path*"],
};