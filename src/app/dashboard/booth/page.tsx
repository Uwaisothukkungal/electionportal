import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Booth Dashboard | ElectionPortal',
  description: 'Real-time statistics for the booth.',
};

export default async function BoothDashboard() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (session.role !== 'BOOTH_ADMIN') redirect('/admin');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      boothId: true,
      partyId: true,
      booth: {
        select: {
          id: true,
          number: true,
          name: true,
          totalVoters: true,
          panchayat: { select: { name: true } },
        },
      },
      party: { select: { name: true, abbrev: true } },
    },
  });

  if (!user?.boothId || !user.booth || !user.partyId || !user.party) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-10 max-w-md text-center">
          <div className="text-5xl mb-6">⚠️</div>
          <h1 className="text-xl font-black text-amber-900 mb-2">Account Not Ready</h1>
          <p className="text-sm font-medium text-amber-700/80 leading-relaxed">
            Your account is missing a Booth or Party assignment. Please contact the Super Admin.
          </p>
        </div>
      </div>
    );
  }

  const allVotedMarks = await prisma.voterMark.findMany({
    where: { voter: { boothId: user.boothId }, hasVoted: true },
    select: { voterId: true },
  });
  const boothVotedCount = new Set(allVotedMarks.map(m => m.voterId)).size;

  const partyMarks = await prisma.voterMark.findMany({
    where: { voter: { boothId: user.boothId }, user: { partyId: user.partyId } },
    select: { hasVoted: true, partyId: true },
  });

  const predictedForUs = partyMarks.filter(m => m.partyId === user.partyId).length;
  const votedForUs = partyMarks.filter(m => m.partyId === user.partyId && m.hasVoted).length;
  
  const totalPredicted = predictedForUs;
  const votedCount = votedForUs;
  const pendingCount = totalPredicted - votedCount;
  const pollingPercentage = totalPredicted > 0 ? ((votedCount / totalPredicted) * 100).toFixed(1) : '0.0';

  const stats = [
    { label: 'Booth Polled', value: boothVotedCount, icon: '📮', color: 'gray' },
    { label: 'Predicted (Us)', value: totalPredicted, icon: '📈', color: 'blue' },
    { label: 'Voted (Us)', value: votedCount, icon: '✅', color: 'emerald' },
    { label: 'Pending (Us)', value: pendingCount, icon: '⏳', color: 'amber' },
    { label: 'Polling %', value: `${pollingPercentage}%`, icon: '📊', color: 'teal' },
  ];

  const colorMap: any = {
    gray: 'text-gray-600 bg-gray-100',
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    teal: 'text-teal-600 bg-teal-50',
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-1 px-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 font-bold text-sm uppercase tracking-wider">
          Real-time statistics for {user.party.abbrev} in Booth {user.booth.number}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300"
          >
            <div className={`text-2xl mb-6 p-3 rounded-2xl w-fit ${colorMap[stat.color]}`}>{stat.icon}</div>
            <div className="text-4xl font-black text-gray-900 mb-1 tracking-tighter">{stat.value}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            title: 'Party Update',
            desc: "Map your party's voters and candidate predicted affiliations.",
            href: '/dashboard/booth/party-update',
            icon: '📝',
            accent: 'blue'
          },
          {
            title: 'Election Counting',
            desc: "Monitor live voter turnout and record polled citizens.",
            href: '/dashboard/booth/election-counting',
            icon: '🗳️',
            accent: 'emerald'
          }
        ].map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="group p-8 rounded-[2.5rem] bg-white border border-gray-100 hover:border-emerald-600/20 hover:bg-gray-50/50 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-3xl bg-gray-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{link.icon}</div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{link.title}</h3>
                <p className="text-sm font-medium text-gray-500 max-w-[200px] leading-relaxed">{link.desc}</p>
              </div>
            </div>
            <span className="text-2xl font-black text-gray-200 group-hover:text-emerald-600 group-hover:translate-x-2 transition-all">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

import Link from 'next/link';
