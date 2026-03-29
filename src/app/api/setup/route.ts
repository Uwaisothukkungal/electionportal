import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const count = await prisma.user.count();
    return NextResponse.json({ initialized: count > 0 });
  } catch {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Guard: only allow if no users exist
    const count = await prisma.user.count();
    if (count > 0) {
      return NextResponse.json(
        { error: 'Application is already initialized.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, password, name } = body;

    if (!username || !email || !password || !name) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        username,
        email,
        name,
        passwordHash,
        role: 'SUPER_ADMIN',
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    // Unique constraint violation
    if (msg.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Username or email already exists.' },
        { status: 409 }
      );
    }
    console.error('[setup]', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
