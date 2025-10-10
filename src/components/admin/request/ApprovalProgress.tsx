"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

function getStatusVariant(status: string) {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "APPROVED":
      return "default";
    case "DENIED":
      return "destructive";
    default:
      return "secondary";
  }
}

export function ApprovalProgress({ approvals }: { approvals }) {
  return (
    <div className="mb-4">
      <Label className="text-sm font-medium">Approval Progress</Label>
      <div className="mt-3 space-y-2">
        {approvals.map((approval) => (
          <div
            key={approval.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-muted/40"
          >
            <div>
              <p className="font-medium text-sm">
                Level {approval.level}: {approval.approver.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {approval.approver.email}
              </p>
            </div>
            <Badge
              variant={getStatusVariant(approval.status)}
              className="text-xs"
            >
              {approval.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
