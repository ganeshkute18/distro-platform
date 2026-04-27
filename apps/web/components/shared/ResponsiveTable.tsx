// Responsive table component that adapts to mobile view
'use client';

import { ReactNode } from 'react';

interface TableColumn {
  header: string;
  accessor: string;
  cell?: (value: any, row: any) => ReactNode;
  width?: string;
  className?: string;
}

interface ResponsiveTableProps {
  data: any[];
  columns: TableColumn[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  mobileCardView?: boolean;
}

export function ResponsiveTable({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick,
  mobileCardView = true,
}: ResponsiveTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Desktop table view
  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  className={`px-4 py-3 text-left text-sm font-semibold text-foreground ${column.className || ''}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={`border-b transition-colors ${
                  onRowClick ? 'hover:bg-accent cursor-pointer' : ''
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.accessor}
                    className={`px-4 py-3 text-sm text-foreground ${
                      column.className || ''
                    }`}
                  >
                    {column.cell
                      ? column.cell(row[column.accessor], row)
                      : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View - Card Layout */}
      {mobileCardView && (
        <div className="md:hidden space-y-3">
          {data.map((row, idx) => (
            <div
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={`p-4 border rounded-lg space-y-2 ${
                onRowClick ? 'hover:bg-accent cursor-pointer' : ''
              }`}
            >
              {columns.map((column) => (
                <div
                  key={column.accessor}
                  className="flex items-start justify-between"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {column.header}
                  </span>
                  <span className="text-sm font-medium text-foreground text-right">
                    {column.cell
                      ? column.cell(row[column.accessor], row)
                      : row[column.accessor]}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
