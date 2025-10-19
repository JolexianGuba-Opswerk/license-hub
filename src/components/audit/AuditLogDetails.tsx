"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getActionVariant } from "./helper";
import { format } from "date-fns";
import { X } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  description: string;
  entity: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface LogDetailDialogProps {
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}

export function LogDetailDialog({ log, open, onClose }: LogDetailDialogProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden rounded-2xl border shadow-2xl">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b px-6 py-4 bg-muted/50">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Audit Log Details
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Body */}
        <ScrollArea className="h-[70vh] px-6 py-5">
          <div className="space-y-6">
            <BasicInfoSection log={log} />
            <DescriptionSection log={log} />
            <UserInfoSection log={log} />
            <ChangesSection log={log} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

const BasicInfoSection = ({ log }: { log: AuditLog }) => (
  <Card className="border-muted shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-semibold text-foreground/90">
        Basic Information
      </CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
      <InfoRow label="Action">
        <Badge variant={getActionVariant(log.action)}>{log.action}</Badge>
      </InfoRow>
      <InfoRow label="Entity">{log.entity}</InfoRow>
      <InfoRow label="Entity ID">
        <span className="font-mono text-xs break-all">{log.entityId}</span>
      </InfoRow>
      <InfoRow label="Date">{format(new Date(log.createdAt), "PPpp")}</InfoRow>
    </CardContent>
  </Card>
);

const DescriptionSection = ({ log }: { log: AuditLog }) => (
  <Card className="border-muted shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-semibold text-foreground/90">
        Description
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
        {log.description}
      </p>
    </CardContent>
  </Card>
);

const UserInfoSection = ({ log }: { log: AuditLog }) => (
  <Card className="border-muted shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-semibold text-foreground/90">
        User Information
      </CardTitle>
    </CardHeader>
    <CardContent>
      {log.user ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <InfoRow label="Name">{log.user.name}</InfoRow>
          <InfoRow label="Email">{log.user.email}</InfoRow>
          {log.ipAddress && (
            <InfoRow label="IP Address">{log.ipAddress}</InfoRow>
          )}
          {log.userAgent && (
            <InfoRow label="User Agent" className="col-span-2">
              <span className="text-xs text-muted-foreground break-words">
                {log.userAgent}
              </span>
            </InfoRow>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This action was system-generated.
        </p>
      )}
    </CardContent>
  </Card>
);

const ChangesSection = ({ log }: { log: AuditLog }) => {
  if (!log.oldValues && !log.newValues) return null;

  return (
    <Card className="border-muted shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground/90">
          Changes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="unified" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="unified">Unified View</TabsTrigger>
            <TabsTrigger value="split">Split View</TabsTrigger>
          </TabsList>

          {/* Unified */}
          <TabsContent value="unified" className="space-y-2">
            {Object.entries(log.newValues || {}).map(([key, value]) => (
              <div
                key={key}
                className="text-sm flex flex-col sm:flex-row sm:items-start"
              >
                <span className="font-medium min-w-28 capitalize">{key}:</span>
                <div className="sm:ml-3 mt-1 sm:mt-0">
                  {log.oldValues && log.oldValues[key] !== undefined && (
                    <div className="text-red-600 line-through text-xs">
                      {JSON.stringify(log.oldValues[key])}
                    </div>
                  )}
                  <div className="text-green-600">{JSON.stringify(value)}</div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Split */}
          <TabsContent value="split" className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2 text-foreground/80">
                Before
              </h4>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-52 border">
                {JSON.stringify(log.oldValues, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2 text-foreground/80">
                After
              </h4>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-52 border">
                {JSON.stringify(log.newValues, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const InfoRow = ({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex items-start ${className}`}>
    <span className="font-medium w-24 text-muted-foreground">{label}:</span>
    <div className="ml-2">{children}</div>
  </div>
);
