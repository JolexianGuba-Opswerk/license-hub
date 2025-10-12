"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AssignmentRow from "./AssignmentRow";
import { Package } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
interface AssignmentsTableProps {
  assignments: any[];
  viewAssignmentDetails: (id: string) => void;
  startAssignment: (id: string, e: React.MouseEvent) => void;
}

export default function AssignmentsTable({
  assignments,
  viewAssignmentDetails,
  startAssignment,
}: AssignmentsTableProps) {
  if (assignments.length === 0 || !assignments) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No assignments found matching your criteria.</p>
        <p className="text-sm">
          All assignments have been processed or are waiting for external
          handlers.
        </p>
      </div>
    );
  }
  console.log(assignments);
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requestor</TableHead>
              <TableHead>Request ID</TableHead>
              <TableHead>Licenses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments?.map((assignment) => (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                viewAssignmentDetails={viewAssignmentDetails}
                startAssignment={startAssignment}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
