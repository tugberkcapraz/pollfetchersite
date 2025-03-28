import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Remove the dotenv import and config line - this won't work in Edge Runtime
// import dotenv from 'dotenv'
// dotenv.config()

// Define allowed origins. '*' is less secure. Replace with your production frontend URL if possible.
const allowedOrigins = ['*']; // Or ['https://your-production-domain.com']

function setCorsHeaders(response: NextResponse) {
  // Ideally, check request.headers.get('origin') against allowedOrigins
  // For simplicity now, we allow any origin ('*')
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400'); // Cache preflight response for 1 day
  return response;
}

export function middleware(request: NextRequest) {
  // Handle preflight requests (OPTIONS) for the report API
  if (request.method === 'OPTIONS' && request.nextUrl.pathname === '/api/report') {
    const response = new NextResponse(null, { status: 204 }); // No Content for OPTIONS
    return setCorsHeaders(response);
  }

  // Handle actual requests
  const response = NextResponse.next();

  // Add CORS headers to responses for the report API
  if (request.nextUrl.pathname === '/api/report') {
    return setCorsHeaders(response);
  }

  // Allow embedding from any origin when accessing embed routes
  if (request.nextUrl.pathname.startsWith('/embed')) {
    // Remove X-Frame-Options to allow embedding in iframes
    response.headers.delete('X-Frame-Options');
    // Set Content-Security-Policy to allow embedding
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'self' *;"
    );
  }

  // For other routes, just continue
  return response;
}

export const config = {
  // Match only the report API route and potentially other API routes if needed
  matcher: '/api/report',
  // Only run middleware on embed routes
  matcher: '/embed/:path*',
} 