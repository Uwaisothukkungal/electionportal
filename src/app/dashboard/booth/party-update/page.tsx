import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { PartyUpdateGrid } from '@/components/booth/PartyUpdateGrid';

export default async function PartyUpdatePage() {
  const session = await getSession();
  if (!session || session.role !== 'BOOTH_ADMIN') redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, boothId: true, partyId: true }
  });

  if (!user?.boothId) return <div>Booth not assigned.</div>;

  const [totalVoters, parties, initialMarks] = await Promise.all([
    prisma.booth.findUnique({ where: { id: user.boothId }, select: { totalVoters: true } }),
    prisma.party.findMany({ select: { id: true, name: true, abbrev: true } }),
    prisma.voterMark.findMany({
      where: { 
        voter: { boothId: user.boothId },
        user: { partyId: user.partyId } // Filter to our party's effort
      },
      select: { voter: { select: { serialNumber: true } }, partyId: true, hasVoted: true }
    })
  ]);

  const formattedMarks = initialMarks.map(m => ({
    serialNumber: m.voter.serialNumber,
    partyId: m.partyId,
    hasVoted: m.hasVoted
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">Party Update</h1>
        <p className="text-slate-400 text-sm">Assign predicted political party affiliations to voters in your booth.</p>
      </div>
      <PartyUpdateGrid 
        boothId={user.boothId} 
        totalVoters={totalVoters?.totalVoters ?? 0} 
        parties={parties} 
        initialMarks={formattedMarks} 
      />
    </div>
  );
}
