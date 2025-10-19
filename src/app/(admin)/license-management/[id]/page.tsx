"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDateTime } from "@/lib/utils/formatDateTime";
import { License } from "@/lib/schemas/license-management/license";
import { LicenseStatus, LicenseType } from "@prisma/client";
import {
  ArrowLeft,
  RefreshCw,
  Building,
  Calendar,
  Users,
  Package,
} from "lucide-react";
import { LicenseAuditDrawer } from "@/components/admin/license-management/LicenseAuditLogs";
import { ManageLicenseKeysDrawer } from "@/components/admin/license-management/ManageLicenseKeyDrawer";

function LicenseDetailsSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 p-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* License Overview Skeleton */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center space-y-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-6 w-24" />
          </CardContent>
        </Card>

        {/* License Details Skeleton */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* License Information Skeleton */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage & Cost Skeleton */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-5 w-36" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Skeleton */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LicenseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const {
    data: license,
    error,
    isLoading,
    mutate,
  } = useSWR<License>(
    id ? `/api/license-management/${id}` : null,
    fetcher,
    { dedupingInterval: 1000 * 60 * 5 } // 5 minutes
  );

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 p-4 text-red-500 border border-red-200 rounded-lg bg-red-50">
          <div className="flex-1">
            <h3 className="font-semibold">Failed to load license</h3>
            <p className="text-sm text-red-600">Please try again later</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }
  const getExpiryBadge = (expiryDate?: string | Date) => {
    if (!expiryDate) return <Badge variant="secondary">No Expiry</Badge>;

    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return <Badge variant="destructive">Expired</Badge>;
    if (diffDays <= 3)
      return (
        <Badge variant="destructive">
          Expiring Soon ({Math.ceil(diffDays)}d)
        </Badge>
      );

    return <Badge variant="default">{formatDateTime(expiry)}</Badge>;
  };

  const getStatusBadge = (status: LicenseStatus) => {
    switch (status) {
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>;
      case "AVAILABLE":
        return <Badge variant="secondary">Available</Badge>;
      case "FULL":
        return <Badge variant="default">Full</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: LicenseType) => {
    switch (type) {
      case "SEAT_BASED":
        return <Badge variant="outline">Seat Based</Badge>;
      case "KEY_BASED":
        return <Badge variant="default">Key Based</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusVariant = (status: LicenseStatus) => {
    switch (status) {
      case "EXPIRED":
        return "destructive";
      case "AVAILABLE":
        return "secondary";
      case "FULL":
        return "default";
      default:
        return "outline";
    }
  };

  const getSeatStatusColor = (percentage: number, type: string) => {
    if (type === "SEAT_USAGE") {
      if (percentage >= 90) return "text-red-600";
      if (percentage >= 75) return "text-orange-600";
      return "text-green-600";
    } else {
      if (percentage >= 90) return "text-red-600";
      if (percentage >= 75) return "text-orange-600";

      return "text-green-600";
    }
  };

  if (isLoading) {
    return <LicenseDetailsSkeleton />;
  }

  if (!license) {
    return (
      <div className="w-full flex flex-col gap-6 p-6">
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">License Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The license youre looking for doesnt exist or has been removed.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to License Management
          </Button>
        </div>
      </div>
    );
  }

  const usagePercentage = Math.round(
    (license._count.licenseKeys / license.totalSeats) * 100
  );
  const unassignedPercentage = Math.round(
    (license.unassignedKeysCount / license._count.licenseKeys) * 100
  );

  return (
    <div className="w-full flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/license-management")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              License Details
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage license information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ManageLicenseKeysDrawer license={license}>
            <Button variant="outline">
              {license.type === "KEY_BASED"
                ? " Manage License Keys"
                : "Manage License Seats"}
            </Button>
          </ManageLicenseKeysDrawer>
          <LicenseAuditDrawer licenseId={id}>
            <Button variant="outline">View Audit Logs</Button>
          </LicenseAuditDrawer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* License Overview Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">License Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center mt-15">
            <h2 className="text-xl font-semibold mb-2">{license.name}</h2>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {license.description || "No description provided"}
            </p>
            <Badge variant={getStatusVariant(license.status)} className="mb-3">
              {license.status}
            </Badge>

            {/* Usage Progress Bar */}
            <div className="w-full mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seat Usage</span>
                <span
                  className={`font-semibold ${getSeatStatusColor(
                    usagePercentage,
                    "SEAT_USAGE"
                  )}`}
                >
                  {Math.round(
                    (license._count.licenseKeys / license.totalSeats) * 100
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    usagePercentage >= 90
                      ? "bg-red-500"
                      : usagePercentage >= 75
                      ? "bg-orange-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {license._count.licenseKeys} of {license.totalSeats} seats used
              </p>
            </div>

            <div className="w-full mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unassigned Seats</span>
                <span
                  className={`font-semibold ${getSeatStatusColor(
                    unassignedPercentage,
                    "UNASSIGNED_USAGE"
                  )}`}
                >
                  {Math.round(
                    (license.unassignedKeysCount / license._count.licenseKeys) *
                      100
                  ) | 0}
                  %
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    unassignedPercentage >= 90
                      ? "bg-red-500"
                      : unassignedPercentage >= 75
                      ? "bg-orange-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${unassignedPercentage | 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {license.unassignedKeysCount} of {license._count.licenseKeys}{" "}
                seats used
              </p>
            </div>
          </CardContent>
        </Card>

        {/* License Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>License Information</CardTitle>
            <CardDescription>
              Detailed information about the license and its usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* License Information */}
              <DetailSection
                icon={<Building className="h-4 w-4" />}
                title="License Information"
                fields={[
                  { label: "Vendor", value: license.vendor },
                  { label: "Type", value: getTypeBadge(license.type) },
                  { label: "Cost", value: formatCurrency(license.cost) },
                ]}
              />

              {/* Usage & Expiry */}
              <DetailSection
                icon={<Users className="h-4 w-4" />}
                title="Usage & Expiry"
                fields={[
                  {
                    label: "Available Seats",
                    value: `${license._count.licenseKeys} / ${license.totalSeats} available`,
                  },
                  {
                    label: "Expiry Date",
                    value: license.expiryDate
                      ? getExpiryBadge(license.expiryDate)
                      : "No expiry",
                  },
                  {
                    label: "Status",
                    value: getStatusBadge(license.status),
                  },
                ]}
              />

              {/* Timeline */}
              <div className="sm:col-span-2">
                <Separator className="my-4" />
                <DetailSection
                  icon={<Calendar className="h-4 w-4" />}
                  title="Timeline"
                  fields={[
                    {
                      label: "Created At",
                      value: formatDateTime(license.createdAt),
                      className: "text-sm",
                    },
                    {
                      label: "Last Updated",
                      value: formatDateTime(license.updatedAt),
                      className: "text-sm",
                    },
                    {
                      label: "Added By",
                      value: license.licenseAddedBy?.name
                        ? `Added by ${license.licenseAddedBy.name}`
                        : "Automatically created by the system",
                      className: "text-sm",
                    },
                  ]}
                  layout="row"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* Detail Section Component */
function DetailSection({
  icon,
  title,
  fields,
  layout = "column",
}: {
  icon: React.ReactNode;
  title: string;
  fields: Array<{
    label: string;
    value: React.ReactNode;
    className?: string;
  }>;
  layout?: "column" | "row";
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-base">{title}</h3>
      </div>
      <div
        className={layout === "row" ? "grid grid-cols-2 gap-6" : "space-y-3"}
      >
        {fields.map((field, index) => (
          <div key={index}>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {field.label}
            </p>
            <div
              className={`font-semibold text-foreground ${
                field.className || ""
              }`}
            >
              {field.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
