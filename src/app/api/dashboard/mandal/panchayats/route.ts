import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDashboardUser } from '@/lib/dashboard-auth';

export async function GET() {
  const user = await getDashboardUser(['MANDAL_ADMIN']);
  if (!user || !user.constituencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const panchayats = await prisma.panchayat.findMany({
    where: { constituencyId: user.constituencyId },
    include: {
      _count: {
        select: { users: { where: { partyId: user.partyId } }, booths: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json(panchayats);
}
