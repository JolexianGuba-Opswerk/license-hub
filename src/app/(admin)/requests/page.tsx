"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Eye, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetcher } from "@/lib/fetcher";

export const SkeletonLoader = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="animate-pulse flex gap-4 p-4 border rounded-lg">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-6 w-24 bg-gray-200 rounded"></div>
      </div>
    ))}
  </div>
);

export default function RequestsPage() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("active");
  const {
    data: requests,

    isLoading,
  } = useSWR(`/api/request?archived=${activeTab === "archive"}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 1000 * 60 * 5,
  });
  const viewRequestDetails = (id: string) => router.push(`/requests/${id}`);
  const createNewRequest = () => router.push("/requests/new");

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "APPROVED":
      case "ASSIGNING":
        return "default";
      case "DENIED":
        return "destructive";
      case "DONE":
        return "success";
      default:
        return "secondary";
    }
  };

  const filteredRequests =
    requests?.filter((r) => {
      const matchesSearch =
        r.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requestedForName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requestedForEmail?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || r.status === statusFilter.toUpperCase();

      const matchesTab =
        activeTab === "active"
          ? !["FULFILLED", "DENIED"].includes(r.status)
          : ["FULFILLED", "DENIED"].includes(r.status);

      return matchesSearch && matchesStatus && matchesTab;
    }) || [];

  // Stats
  // const stats = [
  //   {
  //     label: "Total Requests",
  //     value: requests?.length || 0,
  //     color: "text-blue-600",
  //   },
  //   {
  //     label: "Pending",
  //     value: requests?.filter((r) => r.status === "PENDING").length || 0,
  //     color: "text-yellow-600",
  //   },
  //   {
  //     label: "Approved",
  //     value: requests?.filter((r) => r.status === "APPROVED").length || 0,
  //     color: "text-green-600",
  //   },
  //   {
  //     label: "Denied",
  //     value: requests?.filter((r) => r.status === "DENIED").length || 0,
  //     color: "text-red-600",
  //   },
  // ];

  return (
    <div className="container mx-auto py-6 p-5 space-y-6 p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between ">
        <div className="flex items-center gap-4 ">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              License Requests
            </h1>
            <p className="text-muted-foreground">
              Manage and track all license requests
            </p>
          </div>
        </div>
        <Button onClick={createNewRequest}>+ New Request</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 my-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or department..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="ASSIGNING">Assigning</SelectItem>
            <SelectItem value="DENIED">Denied</SelectItem>
            <SelectItem value="FULFILLED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div> */}

      {/* Tabs */}
      <Card className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Requests</TabsTrigger>
            <TabsTrigger value="archive">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4">
                  <SkeletonLoader />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requester</TableHead>
                        <TableHead>Requested For</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow
                          key={request.id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="py-2">
                            <div className="font-medium">
                              {request.requesterName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.requesterEmail}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="font-medium">
                              {request.requestedForName || "Self"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.requestedForEmail || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline">
                              {request.department}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="space-y-1 max-w-[200px]">
                              {request.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="text-sm truncate">
                                  {item.name} ({item.type.toLowerCase()})
                                </div>
                              ))}
                              {request.totalItems > 2 && (
                                <div className="text-sm text-muted-foreground">
                                  +{request.totalItems - 2} more
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge
                              variant={getStatusVariant(request.status)}
                              className="flex items-center gap-1 w-fit"
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="text-sm">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(request.createdAt).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewRequestDetails(request.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
