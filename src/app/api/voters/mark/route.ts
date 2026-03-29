import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';

/** Resolve session and verify BOOTH_ADMIN role; returns user record. */
async function resolveBoothAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('election_session')?.value;
  const session = token ? await decrypt(token) : null;
  if (!session || session.role !== 'BOOTH_ADMIN') return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, boothId: true, partyId: true },
  });
  if (!user || !user.boothId || !user.partyId) return null;
  return user as { id: number; boothId: number; partyId: number };
}

/** 
 * GET /api/voters/mark
 * Returns all marks for the current admin's booth.
 */
export async function GET(request: Request) {
  const user = await resolveBoothAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const boothId = searchParams.get('boothId') ? Number(searchParams.get('boothId')) : user.boothId;

  if (boothId !== user.boothId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const marks = await prisma.voterMark.findMany({
    where: { voter: { boothId } },
    select: {
      partyId: true,
      hasVoted: true,
      voter: { select: { serialNumber: true } }
    },
  });

  const formatted = marks.map((m) => ({
    serialNumber: m.voter.serialNumber,
    partyId: m.partyId,
    hasVoted: m.hasVoted
  }));

  return NextResponse.json({ marks: formatted });
}

/** 
 * POST /api/voters/mark
 * Unified handler for all marking operations.
 */
export async function POST(request: Request) {
  const user = await resolveBoothAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action, serialNumber, boothId, targetPartyId } = body;

  if (!action || !serialNumber || !boothId) {
    return NextResponse.json({ error: 'action, serialNumber, and boothId are required.' }, { status: 400 });
  }

  if (Number(boothId) !== user.boothId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Ensure Voter exists
  const voter = await prisma.voter.upsert({
    where: { serialNumber_boothId: { serialNumber: Number(serialNumber), boothId: Number(boothId) } },
    create: { serialNumber: Number(serialNumber), boothId: Number(boothId) },
    update: {},
  });

  if (action === 'AFFILIATE') {
    if (!targetPartyId) return NextResponse.json({ error: 'targetPartyId required for AFFILIATE' }, { status: 400 });
    
    // Clear and set new affiliation for this admin group
    await prisma.voterMark.deleteMany({
      where: { voterId: voter.id, user: { partyId: user.partyId } }
    });
    
    const mark = await prisma.voterMark.create({
      data: {
        voterId: voter.id,
        partyId: Number(targetPartyId),
        markedBy: user.id,
        // hasVoted remains default or existing if we can toggle? 
        // For simple workflow, we'll keep existing hasVoted if it exists elsewhere?
        // No, current schema is unique(voterId, partyId).
        // If I change affiliation from A to B, does the 'voted' status carry?
        // Usually, 'voted' is for the person, but schema is per-party.
        // We'll reset it to false for the new affiliation as it's a "predicted" mark.
      }
    });
    return NextResponse.json(mark, { status: 201 });
  }

  if (action === 'POLL') {
    // Already mapped -> Toggle or set hasVoted
    const existingMark = await prisma.voterMark.findFirst({
        where: { voterId: voter.id, user: { partyId: user.partyId } }
    });

    if (!existingMark) return NextResponse.json({ error: 'Not mapped to your party' }, { status: 400 });

    const updated = await prisma.voterMark.update({
      where: { id: existingMark.id },
      data: { hasVoted: !existingMark.hasVoted }
    });
    return NextResponse.json(updated);
  }

  if (action === 'MAP_AND_POLL') {
    if (!targetPartyId) return NextResponse.json({ error: 'targetPartyId required for MAP_AND_POLL' }, { status: 400 });

    await prisma.voterMark.deleteMany({
      where: { voterId: voter.id, user: { partyId: user.partyId } }
    });

    const mark = await prisma.voterMark.create({
      data: {
        voterId: voter.id,
        partyId: Number(targetPartyId),
        markedBy: user.id,
        hasVoted: true
      }
    });
    return NextResponse.json(mark, { status: 201 });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
