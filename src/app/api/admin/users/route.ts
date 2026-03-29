import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import bcrypt from 'bcryptjs';

export async function GET() {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const users = await prisma.user.findMany({
    select: {
      id: true, username: true, name: true, email: true, role: true,
      party: { select: { id: true, name: true } },
      constituency: { select: { id: true, name: true } },
      panchayat: { select: { id: true, name: true } },
      booth: { select: { id: true, number: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username, name, password, role, partyId, constituencyId, panchayatId, boothId } = await request.json();
  if (!username || !name || !password || !role) {
    return NextResponse.json({ error: 'Username, name, password and role are required.' }, { status: 400 });
  }
  if (!['MANDAL_ADMIN', 'PANCHAYAT_ADMIN', 'BOOTH_ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        name: name.trim(),
        email: `${username.trim()}@election.local`, // auto-generate email
        passwordHash,
        role,
        partyId: partyId ? Number(partyId) : null,
        constituencyId: constituencyId ? Number(constituencyId) : null,
        panchayatId: panchayatId ? Number(panchayatId) : null,
        boothId: boothId ? Number(boothId) : null,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, ...safe } = user;
    return NextResponse.json(safe, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Username already exists.' }, { status: 409 });
  }
}
