import { cookies } from 'next/headers';

import { Role } from '../types';

export interface Session {
  id: string;
  email: string;
  name: string;
  role: Role;
  businessName?: string;
}

export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) return null;
    const session = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    return session as Session;
  } catch {
    return null;
  }
}
