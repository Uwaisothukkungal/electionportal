import { redirect } from 'next/navigation';
import { getDashboardUser } from '@/lib/dashboard-auth';
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient';

export default async function PanchayatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getDashboardUser(['PANCHAYAT_ADMIN']);

  if (!user || user.role !== 'PANCHAYAT_ADMIN') {
    redirect('/login');
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard/panchayat', icon: '📊' },
    { label: 'Manage Booths', href: '/dashboard/panchayat/manage-booths', icon: '📍' },
  ];

  const headerTitle = user.panchayat?.name || 'Panchayat Admin';
  const headerSubTitle = `${user.party?.abbrev} · Local Access`;

  return (
    <DashboardLayoutClient 
      navItems={navItems}
      headerTitle={headerTitle}
      headerSubTitle={headerSubTitle}
    >
      {children}
    </DashboardLayoutClient>
  );
}
