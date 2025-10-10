"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { User, Building, Mail, Package, Eye, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AssignmentRowProps {
  assignment: any;
  viewAssignmentDetails: (id: string) => void;
  startAssignment: (id: string, e: React.MouseEvent) => void;
}

export default function AssignmentRow({
  assignment,
  viewAssignmentDetails,
  startAssignment,
}: AssignmentRowProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ASSIGNING":
        return "default";
      case "PARTIALLY_ASSIGNED":
        return "secondary";
      case "ASSIGNED":
        return "success";
      case "PENDING_OWNER":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getHandlerBadge = (handlerType: string) => {
    switch (handlerType) {
      case "ITSG":
        return <Badge variant="default">ITSG</Badge>;
      case "NON_ITSG":
        return <Badge variant="secondary">External</Badge>;
      case "MIXED":
        return <Badge variant="outline">Mixed</Badge>;
      default:
        return <Badge variant="outline">{handlerType}</Badge>;
    }
  };

  const canAssign = assignment.items.some(
    (item: any) => item.handler === "ITSG" && item.status === "READY"
  );
  console.log(assignment);
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => viewAssignmentDetails(assignment.id)}
    >
      <TableCell>
        <div>
          <div className="font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />{" "}
            {assignment.requestorName}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" /> {assignment.requesterEmail}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Building className="h-3 w-3" /> {assignment.department}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <code className="text-sm bg-muted px-2 py-1 rounded max-w-[150px] block truncate">
          {assignment.request_id}
        </code>
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          {assignment.items.slice(0, 2).map((item, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <Package className="h-3 w-3 text-muted-foreground" />
              <span>{item.name}</span>
              <Badge variant="outline" className="text-xs">
                {item.handler}
              </Badge>
            </div>
          ))}
          {assignment.totalItems > 2 && (
            <div className="text-sm text-muted-foreground">
              +{assignment.totalItems - 2} more
            </div>
          )}
        </div>
      </TableCell>

      <TableCell>{getHandlerBadge(assignment.handler)}</TableCell>

      <TableCell>
        <Badge variant={getStatusVariant(assignment.status)}>
          {assignment.status.replace("_", " ")}
        </Badge>
      </TableCell>

      <TableCell>
        <div className="text-sm">{assignment.approvedBy}</div>
        <div className="text-xs text-muted-foreground">
          {new Date(assignment.approvedAt).toLocaleDateString()}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-secondary rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{
                width: `${assignment.progressPercent}%`,
              }}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {assignment.analytics.readyToAssignCount}/{assignment.items.length}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              viewAssignmentDetails(assignment.id);
            }}
          >
            <Eye className="h-4 w-4 mr-1" /> View
          </Button>
          {canAssign && (
            <Button
              size="sm"
              onClick={(e) => startAssignment(assignment.id, e)}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Assign
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
