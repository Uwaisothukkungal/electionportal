import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { AdminShell } from '@/components/admin/SidebarNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  return (
    <AdminShell userName={session.name}>
      {children}
    </AdminShell>
  );
}
