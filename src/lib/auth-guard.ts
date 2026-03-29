import { cookies } from 'next/headers';
import { decrypt, SessionPayload } from '@/lib/session';

export async function requireAdmin(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('election_session')?.value;
  const session = token ? await decrypt(token) : null;
  if (!session || session.role !== 'SUPER_ADMIN') return null;
  return session;
}
