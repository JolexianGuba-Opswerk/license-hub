"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface AuditLogsFiltersProps {
  onFilterChange: (filters: {
    search: string;
    actionFilter: string;
    dateRange: string;
  }) => void;
}

export function AuditLogsFilters({ onFilterChange }: AuditLogsFiltersProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const handleApply = () => {
    onFilterChange({ search, actionFilter, dateRange });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
      <Input
        placeholder="Search logs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-60"
      />

      <div className="flex gap-2 items-center">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="CREATED">Created</SelectItem>
            <SelectItem value="UPDATED">Updated</SelectItem>
            <SelectItem value="DELETED">Deleted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleApply} className="flex items-center gap-1">
          <Calendar className="h-4 w-4" /> Apply
        </Button>
      </div>
    </div>
  );
}
