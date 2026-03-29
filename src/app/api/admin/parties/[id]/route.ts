import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { name, abbrev } = await request.json();
  try {
    const party = await prisma.party.update({
      where: { id: Number(id) },
      data: { name: name.trim(), abbrev: abbrev.trim().toUpperCase() },
    });
    return NextResponse.json(party);
  } catch {
    return NextResponse.json({ error: 'Update failed.' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.party.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Cannot delete — party is in use.' }, { status: 409 });
  }
}
