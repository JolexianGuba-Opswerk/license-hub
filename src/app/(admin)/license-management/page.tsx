"use client";

import * as React from "react";
import useSWR from "swr";

import { useSearchParams, useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Pagination } from "@/components/Pagination";
import { CreateLicenseDrawer } from "@/components/admin/license-management/CreateLicenseDrawer";
import { UpdateLicenseDrawer } from "@/components/admin/license-management/UpdateLicenseDrawer";
import { ManageLicenseKeysDrawer } from "@/components/admin/license-management/ManageLicenseKeyDrawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconKey,
  IconEdit,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetcher } from "@/lib/fetcher";

import {
  License,
  LicenseResponse,
} from "@/lib/schemas/license-management/license";
import { LicenseStatus, LicenseType } from "@prisma/client";
import { Trash2Icon } from "lucide-react";
import useDebounce from "@/lib/utils/useDebounce";

export default function LicenseManagementTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") || 1);
  const search = searchParams.get("search") || "";
  const vendor = searchParams.get("vendor") || "ALL";
  const status = searchParams.get("status") || "ALL";
  const type = searchParams.get("type") || "ALL";
  const [searchDebounced, setSearchDebounced] = React.useState(search);
  const [debouncedValue] = useDebounce(searchDebounced, 500);

  const updateParams = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.replace(params.toString() ? `?${params.toString()}` : "");
  };

  React.useEffect(() => {
    updateParams({
      search: debouncedValue || null,
      page: 1,
    });
  }, [debouncedValue]);

  const swrKey = `/api/license-management?page=${page}&search=${search}&vendor=${vendor}&status=${status}&type=${type}`;
  const { data, isLoading, mutate } = useSWR<LicenseResponse>(swrKey, fetcher, {
    revalidateOnFocus: true,
  });

  const totalPages = data?.meta?.totalPages || 1;
  const total = data?.meta?.total;

  const getLicenseStatusBadge = (license: LicenseStatus) => {
    switch (license) {
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>;
      case "AVAILABLE":
        return <Badge variant="secondary">Available</Badge>;
      case "FULL":
        return <Badge variant="default">Full</Badge>;
    }
  };

  const getTypeBadge = (type: LicenseType) => {
    switch (type) {
      case "SEAT_BASED":
        return <Badge variant="outline">Seat Based</Badge>;
      case "KEY_BASED":
        return <Badge variant="default">Key Based</Badge>;
    }
  };
  const formatDate = (dateString: Date | undefined) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString();
  };

  const licensePercentage = (license: License, usageType: string) => {
    let usagePercentage;

    if (usageType === "AVAILABLE_SEATS") {
      usagePercentage =
        ((license._count?.licenseKeys ?? 0) / license.totalSeats) * 100 || 0;
    } else {
      usagePercentage =
        ((license.assignedKeysCount ?? 0) / license._count?.licenseKeys) *
          100 || 0;
    }

    let color = "bg-green-500";
    if (usagePercentage >= 80) {
      color = "bg-red-500";
    } else if (usagePercentage >= 50) {
      color = "bg-yellow-500";
    }

    return { usagePercentage, color };
  };

  return (
    <Tabs defaultValue="licenses" className="w-full flex-col gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search licenses..."
              value={searchDebounced}
              onChange={(e) => setSearchDebounced(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={vendor}
            onValueChange={(value) => updateParams({ vendor: value, page: 1 })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Vendors</SelectItem>
              <SelectItem value="Microsoft">Microsoft</SelectItem>
              <SelectItem value="Adobe">Adobe</SelectItem>
              <SelectItem value="Slack">Slack</SelectItem>
              <SelectItem value="Google">Google</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(value) => updateParams({ status: value, page: 1 })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="FULL">Full</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={type}
            onValueChange={(value) => updateParams({ type: value, page: 1 })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="License Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Type</SelectItem>
              <SelectItem value="SEAT_BASED">Seat Based</SelectItem>
              <SelectItem value="KEY_BASED">Key Based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CreateLicenseDrawer mutate={mutate}>
          <Button variant="outline" size="sm">
            <IconPlus className="h-4 w-4" />
            <span className="hidden lg:inline ml-2">Add License</span>
          </Button>
        </CreateLicenseDrawer>
      </div>

      <TabsContent
        value="licenses"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Name</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Available Seats</TableHead>
                <TableHead>Unassigned Seats</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data || isLoading ? (
                <TableSkeleton rows={5} cols={8} />
              ) : data?.data.length ? (
                data.data.map((license) => (
                  <TableRow key={license.id} className="hover:bg-muted/50">
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => {
                        router.push(`license-management/${license.id}`);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{license.name}</span>
                        {license.description && (
                          <span className="text-sm text-muted-foreground truncate max-w-xs">
                            {license.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{license.vendor}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {license._count.licenseKeys || 0} /{license.totalSeats}
                        {(() => {
                          const { usagePercentage, color } = licensePercentage(
                            license,
                            "AVAILABLE_SEATS"
                          );
                          return (
                            <div className="w-16 bg-secondary rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${color}`}
                                style={{ width: `${usagePercentage}%` }}
                              />
                            </div>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {license.assignedKeysCount || 0} /
                        {license._count.licenseKeys}
                        {(() => {
                          const { usagePercentage, color } = licensePercentage(
                            license,
                            "UNASSIGNED_SEATS"
                          );
                          return (
                            <div className="w-16 bg-secondary rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${color}`}
                                style={{ width: `${usagePercentage}%` }}
                              />
                            </div>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>{license.owner}</TableCell>
                    <TableCell>{formatDate(license?.expiryDate)}</TableCell>
                    <TableCell>
                      {getLicenseStatusBadge(license.status)}
                    </TableCell>
                    <TableCell>{getTypeBadge(license.type)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <UpdateLicenseDrawer
                            license={license}
                            mutate={mutate}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <IconEdit className="h-4 w-4 mr-2" />
                              Edit License
                            </DropdownMenuItem>
                          </UpdateLicenseDrawer>

                          <ManageLicenseKeysDrawer
                            tableSWRKey={swrKey}
                            license={license}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <IconKey className="h-4 w-4 mr-2" />
                              {license.type === "KEY_BASED"
                                ? "Manage Keys"
                                : "Manage Seats"}
                            </DropdownMenuItem>
                          </ManageLicenseKeysDrawer>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2Icon className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-sm text-foreground-muted"
                  >
                    No licenses found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={(newPage) => updateParams({ page: newPage })}
        />
      </TabsContent>
    </Tabs>
  );
}
