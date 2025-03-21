import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // This middleware doesn't modify the request but ensures
  // environment variables are loaded for API routes
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
} 