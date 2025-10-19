"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  Filter,
  X,
  RefreshCw,
  Download,
  ChevronRight,
  Calendar,
  User,
  FileText,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getActionVariant, isInDateRange, exportToCSV } from "./audit/helper";
import { fetcher } from "@/lib/fetcher";
import { LogDetailDialog } from "./audit/AuditLogDetails";

interface AuditLog {
  id: string;
  action: string;
  description: string;
  entity: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  user?: { id: string; name: string; email: string };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLogsDrawerProps {
  entity?: string;
  entityId?: string;
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function AuditLogsDrawer({
  entity,
  entityId,
  open,
  onClose,
  title = "Audit Logs",
}: AuditLogsDrawerProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const query = new URLSearchParams();
  if (entity) query.append("entity", entity);
  if (entityId) query.append("entityId", entityId);

  const {
    data: logs,
    isLoading,
    error,
    mutate,
  } = useSWR(open ? `/api/audit?${query.toString()}` : null, fetcher, {
    revalidateOnFocus: false,
  });

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log: AuditLog) => {
      const matchesSearch =
        log.description.toLowerCase().includes(search.toLowerCase()) ||
        log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        log.entity.toLowerCase().includes(search.toLowerCase());
      const matchesAction =
        actionFilter === "all" || log.action === actionFilter;
      const matchesDate =
        dateRange === "all" || isInDateRange(log.createdAt, dateRange);
      return matchesSearch && matchesAction && matchesDate;
    });
  }, [logs, search, actionFilter, dateRange]);

  const uniqueActions = useMemo(() => {
    if (!logs) return [];
    return [...new Set(logs.map((log: AuditLog) => log.action))].sort();
  }, [logs]);

  const clearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setDateRange("all");
  };

  return (
    <Drawer open={open} onOpenChange={onClose} direction="right">
      <DrawerContent className="fixed right-0 top-0 h-full w-full sm:w-[900px] md:w-[1000px] lg:w-[1100px] bg-background border-l shadow-2xl flex flex-col">
        {/* Header */}
        <DrawerHeader className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <DrawerTitle className="text-lg font-semibold tracking-tight">
            {title}
          </DrawerTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportToCSV(filteredLogs)}
              disabled={!filteredLogs.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </DrawerHeader>

        {/* Filters */}
        <div className="border-b bg-muted/20 px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {(search || actionFilter !== "all" || dateRange !== "all") && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-44">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-5">
              {error ? (
                <div className="text-center text-red-600 py-8">
                  <p>Failed to load audit logs</p>
                  <Button
                    variant="outline"
                    onClick={() => mutate()}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-4 p-3 border rounded-lg"
                    >
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : filteredLogs.length ? (
                <div className="space-y-3">
                  <TooltipProvider>
                    {filteredLogs.map((log) => (
                      <Tooltip key={log.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/40 ${
                              selectedLog?.id === log.id
                                ? "bg-muted border-primary"
                                : ""
                            }`}
                            onClick={() => setSelectedLog(log)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={getActionVariant(log.action)}>
                                  {log.action}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(log.createdAt))}{" "}
                                  ago
                                </span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <p className="text-sm font-medium mb-2 line-clamp-2 max-w-[900px]">
                              {log.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {log.entity}
                                </span>
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {log.user?.name || "System"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-md rounded-xl px-3 py-2 max-w-[400px] text-sm text-gray-700">
                          {log.description}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {search || actionFilter !== "all" || dateRange !== "all"
                    ? "No logs match your filters"
                    : "No audit logs found"}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <LogDetailDialog
          log={selectedLog}
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      </DrawerContent>
    </Drawer>
  );
}
