"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export default function AssignmentsTableSkeleton() {
  // Render 5 skeleton rows as placeholder
  const skeletonRows = Array.from({ length: 5 });

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Request ID</TableHead>
              <TableHead>Licenses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skeletonRows.map((_, idx) => (
              <TableRow key={idx} className="animate-pulse">
                <TableCell>
                  <div className="h-4 w-24 bg-gray-300 rounded mb-1"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-gray-300 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-3 w-full bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-gray-300 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-gray-300 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-3 w-24 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 w-16 bg-gray-200 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-3 w-full bg-gray-200 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-gray-300 rounded"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
