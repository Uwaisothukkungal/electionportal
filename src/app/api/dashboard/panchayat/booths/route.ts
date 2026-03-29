import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDashboardUser } from '@/lib/dashboard-auth';

export async function GET() {
  const user = await getDashboardUser(['PANCHAYAT_ADMIN']);
  if (!user || !user.panchayatId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const booths = await prisma.booth.findMany({
    where: { panchayatId: user.panchayatId },
    include: {
      _count: {
        select: { users: { where: { partyId: user.partyId } } }
      }
    },
    orderBy: { number: 'asc' }
  });

  return NextResponse.json(booths);
}
