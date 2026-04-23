import { cookies } from 'next/headers';

export interface Session {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'STAFF' | 'CUSTOMER';
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
