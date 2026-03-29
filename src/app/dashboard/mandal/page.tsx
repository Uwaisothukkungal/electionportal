import { redirect } from 'next/navigation';
import { getDashboardUser } from '@/lib/dashboard-auth';
import { prisma } from '@/lib/prisma';
import { MandalDashboardClient } from '@/components/dashboard/MandalDashboardClient';

export default async function MandalDashboard() {
  const user = await getDashboardUser(['MANDAL_ADMIN']);
  if (!user || !user.constituencyId || !user.partyId) redirect('/login');

  // 1. Total Electorate for the entire Mandal
  const sumResult = await prisma.booth.aggregate({
    where: { panchayat: { constituencyId: user.constituencyId } },
    _sum: { totalVoters: true }
  });
  const totalElectorate = sumResult._sum.totalVoters || 0;

  // 2. Aggregate Stats for the entire Mandal (Constituency)
  const [totalPredicted, totalPolled] = await Promise.all([
    prisma.voterMark.count({
      where: { 
        voter: { booth: { panchayat: { constituencyId: user.constituencyId } } },
        partyId: user.partyId 
      }
    }),
    prisma.voterMark.count({
      where: { 
        voter: { booth: { panchayat: { constituencyId: user.constituencyId } } },
        partyId: user.partyId,
        hasVoted: true
      }
    })
  ]);

  // 3. Breakdown by Panchayat
  const panchayats = await prisma.panchayat.findMany({
    where: { constituencyId: user.constituencyId },
    include: {
        booths: {
            include: {
                voters: {
                    include: {
                        marks: {
                            where: { partyId: user.partyId }
                        }
                    }
                }
            }
        }
    }
  });

  const initialPanchayats = panchayats.map(p => {
      let pPredicted = 0;
      let pPolled = 0;
      p.booths.forEach(w => {
          w.voters.forEach(v => {
              v.marks.forEach(m => {
                  pPredicted++;
                  if (m.hasVoted) pPolled++;
              });
          });
      });
      return {
          id: p.id,
          name: p.name,
          predicted: pPredicted,
          polled: pPolled,
          percentage: pPredicted > 0 ? ((pPolled / pPredicted) * 100).toFixed(1) : '0.0'
      };
  });

  return (
    <MandalDashboardClient 
      totalPredicted={totalPredicted}
      totalPolled={totalPolled}
      totalElectorate={totalElectorate}
      mandalName={user.constituency?.name || 'Mandal'}
      partyName={user.party?.name || 'Unknown Party'}
      initialPanchayats={initialPanchayats}
    />
  );
}

