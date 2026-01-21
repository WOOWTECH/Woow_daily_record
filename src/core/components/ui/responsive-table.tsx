"use client";

import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  renderCard: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  renderCard,
  keyExtractor,
  className,
  emptyMessage = "No data",
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-brand-deep-gray">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mobile: Card view */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <div key={keyExtractor(item)}>{renderCard(item, index)}</div>
        ))}
      </div>

      {/* Desktop: Table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "text-left p-3 text-sm font-medium text-brand-deep-gray",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="border-b border-white/10 hover:bg-white/5"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn("p-3 text-sm", col.className)}
                  >
                    {col.render
                      ? col.render(item[col.key], item)
                      : String(item[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
