import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';

export default async function RootPage() {
  const session = await getServerSession();

  if (!session) redirect('/login');

  switch (session.role) {
    case 'OWNER':  redirect('/owner/dashboard');
    case 'STAFF':  redirect('/staff/orders');
    case 'CUSTOMER': redirect('/catalog');
    default: redirect('/login');
  }
}
