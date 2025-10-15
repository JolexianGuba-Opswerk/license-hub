"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Building,
  Mail,
  FileText,
  Package,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { RequestDetailsSkeleton } from "@/components/admin/request/RequestDetailsSkeleton";

export default function ProcurementDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const procurementId = params.id as string;
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: procurement, isLoading } = useSWR(
    procurementId ? `/api/procurement/${procurementId}` : null,
    fetcher
  );

  console.log(procurement);
  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/procurement/${procurementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: "secondary" as const, label: "Pending" },
      APPROVED: { variant: "default" as const, label: "Approved" },
      REJECTED: { variant: "destructive" as const, label: "Rejected" },
      CANCELLED: { variant: "outline" as const, label: "Cancelled" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPurchaseStatusBadge = (status: string) => {
    const statusConfig = {
      NOT_STARTED: { variant: "secondary" as const, label: "Not Started" },
      ORDERED: { variant: "default" as const, label: "Ordered" },
      DELIVERED: { variant: "default" as const, label: "Delivered" },
      INSTALLED: { variant: "success" as const, label: "Installed" },
      CANCELLED: { variant: "destructive" as const, label: "Cancelled" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.NOT_STARTED;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <RequestDetailsSkeleton />;
  }

  if (!procurement) {
    return (
      <div className="container mx-auto py-8 text-center">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Procurement Not Found
        </h1>
        <p className="text-gray-600 mb-4">
          The procurement request youre looking for doesnt exist.
        </p>
        <Button onClick={() => router.push("/procurement")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Procurement
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 p-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/procurement")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Procurement Request
            </h1>
            <p className="text-gray-600">ID: {procurement.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(procurement.status)}
          {getPurchaseStatusBadge(procurement.purchaseStatus)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Item Description
                  </label>
                  <p className="text-gray-900 font-medium">
                    {procurement.itemDescription}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Quantity
                  </label>
                  <p className="text-gray-900 font-medium">
                    {procurement.quantity}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Justification
                </label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                  {procurement.justification}
                </p>
              </div>

              {procurement.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Additional Notes
                  </label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                    {procurement.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor & Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Vendor & Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Vendor Name
                  </label>
                  <p className="text-gray-900 font-medium">
                    {procurement.vendor}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Vendor Email
                  </label>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {procurement.vendorEmail || "Not provided"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Price per Unit
                  </label>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    {procurement.price
                      ? `${
                          procurement.currency
                        } ${procurement.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Quantity
                  </label>
                  <p className="text-gray-900 font-medium">
                    {procurement.quantity}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Total Cost
                  </label>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    {procurement.totalCost
                      ? `${
                          procurement.currency
                        } ${procurement.totalCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "Not calculated"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {procurement.attachments?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Attachments ({procurement.attachments?.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {procurement.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded{" "}
                            {format(
                              new Date(attachment.uploadedAt),
                              "MMM dd, yyyy 'at' h:mm a"
                            )}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Requested By</p>
                    <p className="text-sm text-gray-600">
                      {procurement.requestedBy.firstName}{" "}
                      {procurement.requestedBy.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {procurement.requestedBy.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Request Date</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(procurement.createdAt), "MMM dd, yyyy")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(procurement.createdAt), "h:mm a")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(procurement.updatedAt), "MMM dd, yyyy")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(procurement.updatedAt), "h:mm a")}
                    </p>
                  </div>
                </div>

                {procurement.expectedDelivery && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Expected Delivery</p>
                      <p className="text-sm text-gray-600">
                        {format(
                          new Date(procurement.expectedDelivery),
                          "MMM dd, yyyy"
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Charge to Department</p>
                <Badge variant="outline">{procurement.cc}</Badge>
              </div>

              {procurement.approvedBy && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Approved By</p>
                      <p className="text-sm text-gray-600">
                        {procurement.approvedBy.firstName}{" "}
                        {procurement.approvedBy.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {procurement.approvedBy.email}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {procurement.rejectionReason && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Rejection Reason</p>
                      <p className="text-sm text-red-600">
                        {procurement.rejectionReason}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Related Items */}
          <Card>
            <CardHeader>
              <CardTitle>Related Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {procurement.requestItem && (
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">Linked License</p>
                  <p className="text-sm text-gray-600">
                    {procurement.requestItem.license.name}
                  </p>
                </div>
              )}

              {procurement.requestItem && (
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">Linked Request Item</p>
                  <p className="text-sm text-gray-600">
                    {procurement.requestItem.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {procurement.requestItem.id}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {procurement.status === "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => updateStatus("APPROVED")}
                  disabled={isUpdating}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Request
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const reason = prompt("Please enter rejection reason:");
                    if (reason) {
                      updateStatus("REJECTED");
                      // You might want to send rejection reason in the update
                    }
                  }}
                  disabled={isUpdating}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Request
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
