"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, AlertCircle, FileText } from "lucide-react";

type AuditLog = {
  event?: string;
  data?: Record<string, any>;
  timestamp?: string;
  userDetails: { id: string; email: string };
  changes?: Record<string, any>;
};

interface LicenseAuditDrawerProps {
  licenseId: string;
  children: React.ReactNode;
}

export function LicenseAuditDrawer({
  licenseId,
  children,
}: LicenseAuditDrawerProps) {
  const { data, error, isLoading } = useSWR<AuditLog[]>(
    `/api/license-logs/${licenseId}`,
    fetcher
  );

  const formatEvent = (event: string) => {
    return event.replace(/_/g, " ").toUpperCase();
  };

  const getEventVariant = (event: string) => {
    if (event.includes("CREATE")) return "default";
    if (event.includes("UPDATE")) return "secondary";
    if (event.includes("DELETE")) return "destructive";
    return "outline";
  };

  const formatData = (data: Record<string, any>) => {
    return Object.entries(data).map(([key, value]) => (
      <div key={key} className="flex justify-between text-xs">
        <span className="font-medium">{key}:</span>
        <span className="text-muted-foreground">
          {typeof value === "object" ? JSON.stringify(value) : String(value)}
        </span>
      </div>
    ));
  };

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="h-full w-[500px]">
        <DrawerHeader className="border-b">
          <DrawerTitle>Audit Logs</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading &&
            Array.from({ length: 5 }).map((_, idx) => (
              <Card key={idx}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}

          {error && (
            <div className="flex items-center gap-3 p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <div>
                <p className="font-medium">Failed to load logs</p>
                <p>{error.message || "Please try again"}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && (!data || data.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No audit logs available</p>
            </div>
          )}

          {data?.map((log, idx) => (
            <Card key={idx}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={getEventVariant(log.event || "")}>
                    {formatEvent(log.event || "unknown")}
                  </Badge>
                  {log.timestamp && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>

                {log.userDetails && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-mute-foreground">
                      {log.userDetails.email}
                    </span>
                  </div>
                )}

                {log.changes && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Changes</p>
                    <div className="space-y-1 text-xs bg-muted/50 p-3 rounded">
                      {formatData(log.changes)}
                    </div>
                  </div>
                )}

                {log.data && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Details</p>
                    <div className="space-y-1 text-xs bg-muted/50 p-3 rounded">
                      {formatData(log.data)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="p-4 border-t">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
