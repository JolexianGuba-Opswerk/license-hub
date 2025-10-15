"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

import {
  ArrowLeft,
  Eye,
  PackageSearch,
  PlusCircle,
  ShieldAlert,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { SkeletonLoader } from "@/app/(admin)/requests/page";
import ProcurementFilters from "./ProcurementFilter";

export default function ProcurementTable() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: procurements, isLoading } = useSWR(
    `/api/procurement?archived=${activeTab === "archive"}`,
    fetcher
  );

  const handleNewProcurement = () => router.push("/procurement/new");

  // FORBIDDEN ACCESS HANDLING
  if (procurements?.error === "Forbidden") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-6 bg-muted rounded-full">
          <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground">
          Access Denied
        </h2>
        <p className="text-muted-foreground max-w-md">
          You do not have permission to view this page. Only{" "}
          <strong>Finance</strong>, <strong>Manager</strong>, or{" "}
          <strong>Team Lead</strong> roles are allowed.
        </p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  // FILTERING LOGIC
  const filteredData =
    procurements?.data?.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        item.itemDescription?.toLowerCase().includes(term) ||
        item.vendor?.toLowerCase().includes(term) ||
        item.requestedBy?.name?.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) ?? [];

  // 🎨 Status Badge Variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "APPROVED":
        return "default";
      case "REJECTED":
        return "destructive";
      case "COMPLETED":
        return "success";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              IT Procurement Requests
            </h1>
            <p className="text-muted-foreground">
              Manage and monitor all license procurement requests.
            </p>
          </div>
        </div>

        <Button onClick={handleNewProcurement}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Procurement
        </Button>
      </div>

      {/* Filters */}
      <ProcurementFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Tabs */}
      <Card className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archive">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <CardContent className="p-0">
              {isLoading ? (
                <SkeletonLoader />
              ) : filteredData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <PackageSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No procurements found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => router.push(`/procurement/${item.id}`)}
                      >
                        <TableCell>{item.itemDescription || "N/A"}</TableCell>
                        <TableCell>{item.vendor || "N/A"}</TableCell>
                        <TableCell>{item.requestedBy?.name || "—"}</TableCell>
                        <TableCell>{item.approvedBy?.name || "—"}</TableCell>
                        <TableCell>
                          {item.totalCost
                            ? `₱${Number(item.totalCost).toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/procurement/${item.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
