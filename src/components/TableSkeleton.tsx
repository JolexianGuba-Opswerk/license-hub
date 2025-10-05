import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  widths?: string[];
}

export function TableSkeleton({
  rows = 5,
  cols = 6,
  widths = [],
}: TableSkeletonProps) {
  return (
    <>
      {[...Array(rows)].map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {[...Array(cols)].map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton
                className={`h-4 ${
                  widths[colIndex] ? widths[colIndex] : "w-24"
                }`}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
