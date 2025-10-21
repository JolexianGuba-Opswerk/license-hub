"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { AuditLogsDrawer } from "@/components/AuditLogDrawer";
import { useState } from "react";

export function RequestHeader({ request, router }) {
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const getStatusVariant = (status: string) => {
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
  };

  return (
    <div className="flex items-center gap-4 mb-8">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        className="h-9 w-9"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <h1 className="text-3xl font-bold tracking-tight">Request Details</h1>
        <p className="text-muted-foreground">Request ID: {request.id}</p>
      </div>

      <div>
        <Button variant={"outline"} onClick={() => setShowAuditLogs(true)}>
          View Audit Logs
        </Button>

        <AuditLogsDrawer
          open={showAuditLogs}
          onClose={() => setShowAuditLogs(false)}
          entity="LicenseRequest"
          entityId={request.id}
          title="License Request"
        />
      </div>
      <Badge
        variant={getStatusVariant(request.status)}
        className="text-sm px-3 py-1"
      >
        {request.status}
      </Badge>
    </div>
  );
}
