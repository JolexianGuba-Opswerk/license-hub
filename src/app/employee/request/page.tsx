"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  Building,
  User,
} from "lucide-react";
import { useState } from "react";

interface RequestItem {
  type: "LICENSE" | "OTHER" | "EMAIL";
  name?: string | null;
  status?: string;
}

interface Request {
  id: string;
  requesterName: string;
  requesterEmail: string;
  requestedForName?: string | null;
  requestedForEmail?: string | null;
  department: string;
  items: RequestItem[];
  totalItems: number;
  status: string;
  createdAt: string;
}

interface UserRole {
  role: string;
  department: string;
  userId: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse"
      >
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
      </div>
    ))}
  </div>
);

// Enhanced Requests Table Component
export default function RequestsPage() {
  const router = useRouter();
  const {
    data: requests,
    error,
    isLoading,
  } = useSWR<Request[]>("/api/request", fetcher);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <XCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
        <h3 className="text-lg font-semibold mb-2">Failed to load requests</h3>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "DONE":
        return <CheckCircle className="h-4 w-4" />;
      case "DENIED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getItemDisplayName = (item: RequestItem) =>
    `${item.name} (${item.type.toLowerCase()})` || "N/A";

  const viewRequestDetails = (requestId: string) => {
    router.push(`/requests/${requestId}`);
  };

  // Filter requests based on search, status, and active tab
  const filteredRequests =
    requests?.filter((request) => {
      const matchesSearch =
        request.requesterName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestedForName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.requestedForEmail
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter.toUpperCase();

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "my-requests" &&
          (request.requesterEmail.includes("@") ||
            request.requestedForEmail?.includes("@")));

      return matchesSearch && matchesStatus && matchesTab;
    }) || [];

  // Get status counts for tabs
  const statusCounts = {
    all: requests?.length || 0,
    pending: requests?.filter((r) => r.status === "PENDING").length || 0,
    approved: requests?.filter((r) => r.status === "APPROVED").length || 0,
    assigning: requests?.filter((r) => r.status === "ASSIGNING").length || 0,
    denied: requests?.filter((r) => r.status === "DENIED").length || 0,
    done: requests?.filter((r) => r.status === "DONE").length || 0,
  };

  // Dynamic tabs based on user role and data
  const getTabs = () => {
    const baseTabs = [
      {
        value: "all",
        label: "All Requests",
        count: statusCounts.all,
        icon: Users,
      },
      {
        value: "pending",
        label: "Pending",
        count: statusCounts.pending,
        icon: Clock,
      },
      {
        value: "approved",
        label: "Approved",
        count: statusCounts.approved,
        icon: CheckCircle,
      },
      {
        value: "assigning",
        label: "Assigning",
        count: statusCounts.assigning,
        icon: Building,
      },
      {
        value: "denied",
        label: "Denied",
        count: statusCounts.denied,
        icon: XCircle,
      },
      {
        value: "done",
        label: "Completed",
        count: statusCounts.done,
        icon: CheckCircle,
      },
    ];

    // Add "My Requests" tab if user has personal requests
    const hasPersonalRequests = requests?.some(
      (r) =>
        r.requesterEmail.includes("@") || r.requestedForEmail?.includes("@")
    );

    if (hasPersonalRequests) {
      baseTabs.splice(1, 0, {
        value: "my-requests",
        label: "My Requests",
        count:
          requests?.filter(
            (r) =>
              r.requesterEmail.includes("@") ||
              r.requestedForEmail?.includes("@")
          ).length || 0,
        icon: User,
      });
    }

    return baseTabs;
  };

  const tabs = getTabs();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            License Requests
          </h1>
          <p className="text-muted-foreground">
            Manage and track all license requests in your organization
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{statusCounts.all} total requests</span>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-1 h-5 px-1.5 text-xs"
                        >
                          {tab.count}
                        </Badge>
                      )}
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Filters for All Tabs */}
            <div className="p-4 border-b">
              <div className="flex flex-col sm:flex-row gap-4">
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="assigning">Assigning</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="done">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table Content */}
            <TabsContent value={activeTab} className="m-0">
              <div className="p-0">
                {isLoading ? (
                  <div className="p-6">
                    <SkeletonLoader />
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      No requests found
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "No requests match the current tab selection"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Requester</TableHead>
                          <TableHead>Requested For</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((request) => (
                          <TableRow
                            key={request.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => viewRequestDetails(request.id)}
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {request.requesterName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {request.requesterEmail}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {request.requestedForName || "Self"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {request.requestedForEmail || "N/A"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {request.department}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 max-w-[200px]">
                                {request.items.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="text-sm truncate">
                                    {getItemDisplayName(item)}
                                  </div>
                                ))}
                                {request.totalItems > 2 && (
                                  <div className="text-sm text-muted-foreground">
                                    +{request.totalItems - 2} more
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusVariant(request.status)}
                                className="flex items-center gap-1 w-fit"
                              >
                                {getStatusIcon(request.status)}
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(
                                  request.createdAt
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(
                                  request.createdAt
                                ).toLocaleTimeString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewRequestDetails(request.id);
                                }}
                                className="hover:bg-primary hover:text-primary-foreground"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {!isLoading && requests && requests.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {tabs.slice(0, 6).map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Card key={tab.value} className="text-center">
                <CardContent className="p-4">
                  <IconComponent className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{tab.count}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {tab.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
