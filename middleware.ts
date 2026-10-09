import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle direct navigation to /logout
  if (pathname === '/logout') {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    response.cookies.set('session', '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    return response;
  }

  // Skip middleware for API routes and auth internal calls
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const isAuthPage = pathname.startsWith('/login');

  // If explicit logout query is passed to /login, clear session and stay on login
  if (isAuthPage && request.nextUrl.searchParams.has('logout')) {
    const response = NextResponse.next();
    response.cookies.delete('session');
    response.cookies.set('session', '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    return response;
  }

  const session = request.cookies.get('session')?.value;
  const parsed = session ? await decrypt(session) : null;
  
  if (!parsed && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (parsed && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
