import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET() {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parties = await prisma.party.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(parties);
}

export async function POST(request: Request) {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, abbrev } = await request.json();
  if (!name || !abbrev) return NextResponse.json({ error: 'Name and abbreviation are required.' }, { status: 400 });
  try {
    const party = await prisma.party.create({ data: { name: name.trim(), abbrev: abbrev.trim().toUpperCase() } });
    return NextResponse.json(party, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Name or abbreviation already exists.' }, { status: 409 });
  }
}
