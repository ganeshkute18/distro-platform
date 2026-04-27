// Empty state components with friendly messages
'use client';

import { Package, ShoppingCart, AlertCircle, FileText } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
}: EmptyStateProps) {
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 64 : 48;

  return (
    <div className={`flex flex-col items-center justify-center ${size === 'lg' ? 'py-20' : size === 'sm' ? 'py-8' : 'py-16'}`}>
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {typeof icon === 'string' ? (
            icon as any
          ) : (
            <div style={{ width: iconSize, height: iconSize, opacity: 0.5 }}>
              {icon}
            </div>
          )}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4 max-w-sm text-center">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function NoProducts() {
  return (
    <EmptyState
      icon={<Package className="w-16 h-16" />}
      title="No Products Available"
      description="Your product catalog is empty. Start by adding your first product!"
      size="lg"
    />
  );
}

export function NoOrders() {
  return (
    <EmptyState
      icon={<ShoppingCart className="w-16 h-16" />}
      title="No Orders Yet"
      description="Orders will appear here once customers start placing them."
      size="lg"
    />
  );
}

export function NoInventory() {
  return (
    <EmptyState
      icon={<AlertCircle className="w-16 h-16" />}
      title="Inventory Empty"
      description="Add products to start managing inventory."
      size="lg"
    />
  );
}

export function NoReports() {
  return (
    <EmptyState
      icon={<FileText className="w-16 h-16" />}
      title="No Data Available"
      description="Reports will appear once you have order data."
      size="lg"
    />
  );
}

export function NoSearchResults() {
  return (
    <EmptyState
      icon={<Package className="w-12 h-12" />}
      title="No Results Found"
      description="Try searching with different keywords"
      size="md"
    />
  );
}

export function NoCartItems() {
  return (
    <EmptyState
      icon={<ShoppingCart className="w-16 h-16" />}
      title="Your Cart is Empty"
      description="Start shopping by browsing our products"
      size="lg"
    />
  );
}

export function NoNotifications() {
  return (
    <EmptyState
      icon={<AlertCircle className="w-12 h-12" />}
      title="No Notifications"
      description="You're all caught up!"
      size="md"
    />
  );
}

export function LoadingError({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<AlertCircle className="w-16 h-16" />}
      title="Something Went Wrong"
      description="We couldn't load the data. Please try again."
      action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
      size="lg"
    />
  );
}
