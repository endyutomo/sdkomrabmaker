import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function setCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, X-Action-Allowed-Origin"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Vary", "Origin");
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Only add CORS headers for cross-origin requests
  // Same-origin requests don't need CORS
  if (!origin) {
    return NextResponse.next();
  }

  // Handle preflight (OPTIONS) requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });
    setCorsHeaders(response, origin);
    return response;
  }

  // Add CORS headers using actual request origin (NOT wildcard "*")
  // This is required because RSC fetches include credentials (cookies),
  // and the CORS spec forbids "*" when credentials:true
  const response = NextResponse.next();
  setCorsHeaders(response, origin);
  return response;
}

export const config = {
  matcher: "/:path*",
};
