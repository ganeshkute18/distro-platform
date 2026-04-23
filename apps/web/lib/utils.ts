import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    APPROVED:         'bg-blue-100 text-blue-800 border-blue-200',
    REJECTED:         'bg-red-100 text-red-800 border-red-200',
    PROCESSING:       'bg-orange-100 text-orange-800 border-orange-200',
    DISPATCHED:       'bg-purple-100 text-purple-800 border-purple-200',
    DELIVERED:        'bg-green-100 text-green-800 border-green-200',
    CANCELLED:        'bg-gray-100 text-gray-800 border-gray-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED:         'Approved',
    REJECTED:         'Rejected',
    PROCESSING:       'Processing',
    DISPATCHED:       'Dispatched',
    DELIVERED:        'Delivered',
    CANCELLED:        'Cancelled',
  };
  return map[status] ?? status;
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}
