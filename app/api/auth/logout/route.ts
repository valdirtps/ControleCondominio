import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    cookieStore.set('session', '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    const response = NextResponse.json({ success: true, redirect: '/login' });
    response.cookies.set('session', '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    const response = NextResponse.json({ success: true, redirect: '/login' });
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
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    cookieStore.set('session', '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    const redirectUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('session', '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    return response;
  } catch (error) {
    console.error('Logout GET API error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}



