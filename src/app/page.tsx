import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function RootPage() {
  const count = await prisma.user.count();

  if (count === 0) {
    redirect('/setup');
  } else {
    redirect('/login');
  }
}
