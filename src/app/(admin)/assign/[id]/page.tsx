"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  Building,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  UserCheck,
} from "lucide-react";

// Mock data for specific assignment
const mockAssignment = {
  id: "1",
  requestId: "REQ-001",
  employeeName: "John Doe",
  employeeEmail: "john@company.com",
  department: "Marketing",
  managerName: "Sarah Chen",
  status: "ASSIGNING",
  handlerType: "MIXED",
  approvedAt: "2024-01-16T09:30:00Z",
  approvedBy: "Sarah Chen (ITSG TL)",
  justification:
    "Need these licenses for upcoming marketing campaign and daily operational work.",
  items: [
    {
      id: "1",
      licenseId: "1",
      licenseName: "Microsoft Office 2025",
      vendor: "Microsoft",
      handler: "ITSG",
      type: "SEAT_BASED",
      availableSeats: 5,
      status: "READY",
      assignedKey: "",
      assignedAt: "",
      assignedBy: "",
    },
    {
      id: "2",
      licenseId: "2",
      licenseName: "Figma 2028",
      vendor: "Figma",
      handler: "DESIGN_TEAM",
      type: "KEY_BASED",
      availableSeats: 3,
      status: "PENDING_OWNER",
      assignedKey: "",
      assignedAt: "",
      assignedBy: "",
      ownerName: "Design Team Lead",
      ownerEmail: "design@company.com",
    },
    {
      id: "3",
      licenseId: "3",
      licenseName: "Adobe Photoshop",
      vendor: "Adobe",
      handler: "ITSG",
      type: "SEAT_BASED",
      availableSeats: 0,
      status: "PENDING_PURCHASE",
      assignedKey: "",
      assignedAt: "",
      assignedBy: "",
    },
  ],
};

export default function AssignmentDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "READY":
        return "default";
      case "ASSIGNED":
        return "success";
      case "PENDING_OWNER":
        return "secondary";
      case "PENDING_PURCHASE":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return <CheckCircle className="h-4 w-4" />;
      case "PENDING_OWNER":
        return <UserCheck className="h-4 w-4" />;
      case "PENDING_PURCHASE":
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const startAssignment = () => {
    router.push(`/admin/assignments/${params.id}/assign`);
  };

  const canAssign = mockAssignment.items.some(
    (item) => item.handler === "ITSG" && item.status === "READY"
  );

  const itsgItems = mockAssignment.items.filter(
    (item) => item.handler === "ITSG"
  );
  const externalItems = mockAssignment.items.filter(
    (item) => item.handler !== "ITSG"
  );

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/assignments")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Assignment Details</h1>
            <p className="text-muted-foreground">
              Request ID: {mockAssignment.requestId}
            </p>
          </div>
          <Badge variant="default" className="text-lg px-3 py-1">
            {mockAssignment.status}
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {mockAssignment.employeeName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {mockAssignment.employeeEmail}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {mockAssignment.department}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Manager: {mockAssignment.managerName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {mockAssignment.approvedBy}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Approver
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {new Date(mockAssignment.approvedAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Approved Date
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Actions */}
          {canAssign && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Ready for Assignment
                    </h3>
                    <p className="text-muted-foreground">
                      {
                        itsgItems.filter((item) => item.status === "READY")
                          .length
                      }{" "}
                      ITSG-managed licenses ready to assign
                    </p>
                  </div>
                  <Button onClick={startAssignment} size="lg">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Start Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ITSG Managed Licenses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                ITSG Managed Licenses
                <Badge variant="outline">{itsgItems.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {itsgItems.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {item.licenseName}
                        </h3>
                        <Badge
                          variant={getStatusVariant(item.status)}
                          className="flex items-center gap-1"
                        >
                          {getStatusIcon(item.status)}
                          {item.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Vendor:</span>{" "}
                          {item.vendor}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>
                          <Badge variant="outline" className="ml-2">
                            {item.type}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Availability:</span>
                          <Badge
                            variant={
                              item.availableSeats > 0
                                ? "default"
                                : "destructive"
                            }
                            className="ml-2"
                          >
                            {item.availableSeats > 0
                              ? `${item.availableSeats} seats`
                              : "Out of stock"}
                          </Badge>
                        </div>
                      </div>

                      {item.status === "ASSIGNED" && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="text-sm text-green-800">
                            <strong>Assigned on:</strong>{" "}
                            {new Date(item.assignedAt!).toLocaleString()}
                          </div>
                          <div className="text-sm text-green-800">
                            <strong>Assigned by:</strong> {item.assignedBy}
                          </div>
                          {item.type === "KEY_BASED" && item.assignedKey && (
                            <div className="text-sm text-green-800">
                              <strong>License Key:</strong>
                              <code className="ml-2 bg-green-100 px-2 py-1 rounded">
                                {item.assignedKey}
                              </code>
                            </div>
                          )}
                        </div>
                      )}

                      {item.status === "PENDING_PURCHASE" && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <div className="text-sm text-yellow-800">
                            <strong>Purchase Required:</strong> This license is
                            out of stock. A purchase request needs to be
                            created.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Externally Managed Licenses */}
          {externalItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Externally Managed Licenses
                  <Badge variant="outline">{externalItems.length} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {externalItems.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {item.licenseName}
                          </h3>
                          <Badge
                            variant={getStatusVariant(item.status)}
                            className="flex items-center gap-1"
                          >
                            {getStatusIcon(item.status)}
                            {item.status.replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Vendor:</span>{" "}
                            {item.vendor}
                          </div>
                          <div>
                            <span className="font-medium">Handler:</span>
                            <Badge variant="secondary" className="ml-2">
                              {item.handler}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Owner:</span>
                            <div className="text-muted-foreground">
                              {item.ownerName} ({item.ownerEmail})
                            </div>
                          </div>
                        </div>

                        {item.status === "PENDING_OWNER" && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="text-sm text-blue-800">
                              <strong>Waiting for License Owner:</strong> This
                              license is managed by {item.handler}. The owner
                              has been notified and will assign the license
                              directly.
                            </div>
                          </div>
                        )}

                        {item.status === "ASSIGNED" && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="text-sm text-green-800">
                              <strong>Assigned by Owner:</strong>{" "}
                              {item.assignedBy} on{" "}
                              {new Date(item.assignedAt!).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {mockAssignment.items.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Licenses
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      mockAssignment.items.filter(
                        (item) => item.status === "ASSIGNED"
                      ).length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Assigned</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {
                      mockAssignment.items.filter(
                        (item) => item.status === "READY"
                      ).length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Ready</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {
                      mockAssignment.items.filter((item) =>
                        item.status.includes("PENDING")
                      ).length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
