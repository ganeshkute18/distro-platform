// Enhanced dashboard components with animations and better UX
'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number; // percentage
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export function StatCard({
  label,
  value,
  change,
  icon,
  color = 'primary',
}: StatCardProps) {
  const colorClasses = {
    primary: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950',
    success: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950',
    error: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
  };

  const trendIcon = change === undefined ? null : change > 0 ? (
    <TrendingUp className="w-4 h-4" />
  ) : change < 0 ? (
    <TrendingDown className="w-4 h-4" />
  ) : (
    <Minus className="w-4 h-4" />
  );

  const trendColor = change === undefined ? '' : change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500';

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change !== undefined && (
            <div className={`mt-2 flex items-center gap-1 text-sm ${trendColor}`}>
              {trendIcon}
              <span>{Math.abs(change)}% vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Section heading with optional action
interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: SectionHeadingProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Progress bar with label
interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export function ProgressBar({
  label,
  value,
  max = 100,
  color = 'primary',
}: ProgressBarProps) {
  const percentage = (value / max) * 100;
  const colorClasses = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    error: 'bg-red-600',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">
          {value} / {max}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

// List item with status badge
interface ListItemProps {
  primary: string;
  secondary?: string;
  status?: 'pending' | 'approved' | 'processing' | 'delivered' | 'rejected';
  amount?: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export function ListItem({
  primary,
  secondary,
  status,
  amount,
  icon,
  onClick,
}: ListItemProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const statusLabels = {
    pending: 'Pending',
    approved: 'Approved',
    processing: 'Processing',
    delivered: 'Delivered',
    rejected: 'Rejected',
  };

  return (
    <div
      onClick={onClick}
      className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer flex items-center justify-between"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && <div className="text-muted-foreground flex-shrink-0">{icon}</div>}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground truncate">{primary}</p>
          {secondary && (
            <p className="text-sm text-muted-foreground truncate">{secondary}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {amount && (
          <span className="font-semibold text-foreground">{amount}</span>
        )}
        {status && (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}
          >
            {statusLabels[status]}
          </span>
        )}
      </div>
    </div>
  );
}

// Metric with mini chart (simplified)
interface MetricWithTrendProps {
  label: string;
  value: string | number;
  trend: number; // -100 to 100
}

export function MetricWithTrend({
  label,
  value,
  trend,
}: MetricWithTrendProps) {
  const isPositive = trend > 0;
  const trendColor = isPositive ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500';

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-card border">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`text-3xl font-bold ${trendColor} opacity-20`}>
        {isPositive ? '+' : ''}{trend}%
      </div>
    </div>
  );
}
