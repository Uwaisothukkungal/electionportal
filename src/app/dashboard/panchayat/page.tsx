import { redirect } from 'next/navigation';
import { getDashboardUser } from '@/lib/dashboard-auth';
import { prisma } from '@/lib/prisma';
import { PanchayatDashboardClient } from '@/components/dashboard/PanchayatDashboardClient';

export default async function PanchayatDashboard() {
  const user = await getDashboardUser(['PANCHAYAT_ADMIN']);
  if (!user || !user.panchayatId || !user.partyId) redirect('/login');

  // 1. Total Electorate for the entire Panchayat
  const sumResult = await prisma.booth.aggregate({
    where: { panchayatId: user.panchayatId },
    _sum: { totalVoters: true }
  });
  const totalElectorate = sumResult._sum.totalVoters || 0;

  // 2. Aggregate Stats for the entire Panchayat
  const [totalPredicted, totalPolled] = await Promise.all([
    prisma.voterMark.count({
      where: { 
        voter: { booth: { panchayatId: user.panchayatId } },
        partyId: user.partyId 
      }
    }),
    prisma.voterMark.count({
      where: { 
        voter: { booth: { panchayatId: user.panchayatId } },
        partyId: user.partyId,
        hasVoted: true
      }
    })
  ]);

  // 3. Breakdown by Booth
  const booths = await prisma.booth.findMany({
    where: { panchayatId: user.panchayatId },
    include: {
        voters: {
            include: {
                marks: {
                    where: { partyId: user.partyId }
                }
            }
        }
    }
  });

  const initialBooths = booths.map(w => {
      let wPredicted = 0;
      let wPolled = 0;
      w.voters.forEach(v => {
          v.marks.forEach(m => {
              wPredicted++;
              if (m.hasVoted) wPolled++;
          });
      });
      return {
          id: w.id,
          number: w.number,
          name: w.name,
          predicted: wPredicted,
          polled: wPolled,
          percentage: wPredicted > 0 ? ((wPolled / wPredicted) * 100).toFixed(1) : '0.0'
      };
  });

  return (
    <PanchayatDashboardClient 
      totalPredicted={totalPredicted}
      totalPolled={totalPolled}
      totalElectorate={totalElectorate}
      panchayatName={user.panchayat?.name || 'Panchayat'}
      partyName={user.party?.name || 'Unknown Party'}
      initialBooths={initialBooths}
    />
  );
}
