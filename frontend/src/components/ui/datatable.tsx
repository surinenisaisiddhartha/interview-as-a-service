import * as React from "react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-gray-50 border-b border-gray-100", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("divide-y divide-gray-50", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors hover:bg-gray-50/60 data-[state=selected]:bg-blue-50",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-4 text-left align-middle text-[11px] font-bold uppercase tracking-wider text-gray-400",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-4 py-3 align-middle text-gray-700", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

// Compatibility wrapper — same API as old DataTable
interface Column<T> {
  header: string
  accessor: ((item: T) => React.ReactNode) | keyof T
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
}

function DataTable<T>({ columns, data, onRowClick }: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, i) => (
            <TableHead key={i}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <td colSpan={columns.length} className="py-12 text-center text-sm text-gray-400">
              No data available
            </td>
          </TableRow>
        ) : (
          data.map((item, rowIdx) => (
            <TableRow
              key={rowIdx}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={onRowClick ? "cursor-pointer" : ""}
            >
              {columns.map((col, colIdx) => (
                <TableCell key={colIdx}>
                  {typeof col.accessor === 'function'
                    ? col.accessor(item)
                    : String(item[col.accessor] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, DataTable }
