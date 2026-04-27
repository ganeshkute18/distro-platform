// Reusable loading skeleton component for lists, cards, and tables
'use client';

export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-20 bg-muted rounded-lg"></div>
      <div className="h-20 bg-muted rounded-lg"></div>
      <div className="h-20 bg-muted rounded-lg"></div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-3 p-4 border rounded-lg">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
      <div className="h-8 bg-muted rounded w-1/3"></div>
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="aspect-square bg-muted rounded-lg"></div>
      <div className="h-4 bg-muted rounded w-full"></div>
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-3 bg-muted rounded w-1/2"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="animate-pulse flex gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="h-4 bg-muted rounded flex-1"></div>
        <div className="h-4 bg-muted rounded flex-1"></div>
        <div className="h-4 bg-muted rounded flex-1"></div>
        <div className="h-4 bg-muted rounded flex-1"></div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse flex gap-4 p-4 border rounded-lg">
          <div className="h-4 bg-muted rounded flex-1"></div>
          <div className="h-4 bg-muted rounded flex-1"></div>
          <div className="h-4 bg-muted rounded flex-1"></div>
          <div className="h-4 bg-muted rounded flex-1"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg"></div>
        ))}
      </div>
      {/* Chart */}
      <div className="h-64 bg-muted rounded-lg"></div>
      {/* Table */}
      <SkeletonTable rows={5} />
    </div>
  );
}
