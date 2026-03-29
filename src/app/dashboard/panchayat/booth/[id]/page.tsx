import { redirect, notFound } from 'next/navigation';
import { getDashboardUser } from '@/lib/dashboard-auth';
import { prisma } from '@/lib/prisma';
import { ReadOnlyVoterGrid } from '@/components/booth/ReadOnlyVoterGrid';
import Link from 'next/link';

export default async function PanchayatBoothView({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const boothId = parseInt(id);
  const user = await getDashboardUser(['PANCHAYAT_ADMIN']);
  if (!user || !user.panchayatId || !user.partyId) redirect('/login');

  // Verify booth belongs to this panchayat
  const booth = await prisma.booth.findFirst({
    where: { id: boothId, panchayatId: user.panchayatId },
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

  if (!booth) return notFound();

  // Prepare marks for the grid with party abbrevs
  const marksMap: Record<number, { partyAbbrev: string; voted: boolean }> = {};
  booth.voters.forEach(v => {
    const mark = v.marks[0];
    if (mark) {
      marksMap[v.serialNumber] = {
        partyAbbrev: user.party?.abbrev || '?',
        voted: mark.hasVoted
      };
    }
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="flex flex-col gap-1 text-left">
          <Link href="/dashboard/panchayat" className="group flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] tracking-widest hover:translate-x-[-4px] transition-all">
            <span>←</span> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase mt-4">
            Booth {booth.number} · {booth.name || 'General'}
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
            Performance View for {user.party?.abbrev}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm shadow-gray-200/50">
        <ReadOnlyVoterGrid
          totalVoters={booth.totalVoters}
          marks={marksMap}
        />
      </div>
    </div>
  );
}
