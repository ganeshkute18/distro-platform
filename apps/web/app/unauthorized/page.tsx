import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
      <ShieldAlert className="h-16 w-16 text-destructive/60" />
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">You don't have permission to view this page.</p>
      <Link href="/" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
        Go Home
      </Link>
    </div>
  );
}
