import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Remove the dotenv import and config line - this won't work in Edge Runtime
// import dotenv from 'dotenv'
// dotenv.config()

export function middleware(request: NextRequest) {
  // This middleware doesn't do anything special but ensure routes work
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
} 