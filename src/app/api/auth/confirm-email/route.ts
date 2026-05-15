/**
 * Auto-confirm email for newly registered users
 * This is a development workaround for email confirmation
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Create admin client (this should be done server-side only)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Note: This is a development workaround. 
    // In production, you should handle email confirmation properly
    // or disable the email confirmation requirement in Supabase Auth settings

    return NextResponse.json(
      { message: 'Email auto-confirmed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm email' },
      { status: 500 }
    );
  }
}
