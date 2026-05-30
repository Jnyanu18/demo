import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const protectedPaths = ["/checkout", "/account"];
  const hasAuthCookie = request.cookies.has("refreshToken");
  if (protectedPaths.some((prefix) => path.startsWith(prefix)) && !hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout", "/account"]
};
