import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { BoothLayoutClient } from '@/components/booth/BoothLayoutClient';

export default async function BoothLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Guard: must be logged in and BOOTH_ADMIN
  if (!session || session.role !== 'BOOTH_ADMIN') {
    redirect('/login');
  }

  // Fetch full user record with booth + party details
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      boothId: true,
      partyId: true,
      booth: {
        select: {
          number: true,
          name: true,
        },
      },
      party: {
        select: {
          abbrev: true,
        },
      },
    },
  });

  if (!user?.booth || !user.party) {
    // If not configured, the client or page will show the error state.
    // For now, we'll just redirect to a configuration error or show a simple fallback.
    return <div className="p-10 text-center font-bold text-gray-400">Account Configuration Error. Contact Admin.</div>;
  }

  return (
    <BoothLayoutClient 
      boothInfo={{ number: user.booth.number, name: user.booth.name }} 
      partyAbbrev={user.party.abbrev}
    >
      {children}
    </BoothLayoutClient>
  );
}
