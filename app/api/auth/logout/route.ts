import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Fallback: Clear cookie via next/headers
    const cookieStore = await cookies();
    cookieStore.delete('session');
    
    // Also try setting header explicitly
    response.cookies.set('session', '', { maxAge: 0 });
    
    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    const fallbackResponse = NextResponse.json({ success: true });
    fallbackResponse.cookies.set('session', '', { maxAge: 0 });
    return fallbackResponse;
  }
}
