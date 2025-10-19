"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface AuditLogsListProps {
  logs: any[];
  isLoading: boolean;
  onSelect: (log) => void;
}

export function AuditLogsList({
  logs,
  isLoading,
  onSelect,
}: AuditLogsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px] pr-3">
      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No logs found.
          </p>
        ) : (
          logs.map((log) => (
            <Card
              key={log.id}
              className="cursor-pointer hover:bg-muted/50 transition"
              onClick={() => onSelect(log)}
            >
              <CardContent className="p-4">
                <p className="text-sm font-medium truncate">
                  {log.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {log.action} •{" "}
                  {formatDistanceToNow(new Date(log.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
