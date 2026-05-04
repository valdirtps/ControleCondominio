import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const parsed = session ? await decrypt(session) : null;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  
  if (!parsed && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (parsed && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
