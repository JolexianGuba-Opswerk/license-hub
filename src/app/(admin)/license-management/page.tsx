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
import { formatCurrency } from "@/lib/utils/formatCurrency";
import {
  License,
  LicenseResponse,
} from "@/lib/schemas/license-management/license";
import { LicenseStatus, LicenseType } from "@prisma/client";

export default function LicenseManagementTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") || 1);
  const search = searchParams.get("search") || "";
  const vendor = searchParams.get("vendor") || "ALL";
  const status = searchParams.get("status") || "ALL";
  const type = searchParams.get("type") || "ALL";
  const swrKey = `/api/license-management?page=${page}&search=${search}&vendor=${vendor}&status=${status}`;

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

  const { data, isValidating } = useSWR<LicenseResponse>(swrKey, fetcher, {
    dedupingInterval: 1000 * 60 * 5,
    revalidateOnFocus: false,
  });

  const totalPages = data?.meta?.totalPages || 1;
  const total = data?.meta?.total;

  const getLicenseStatusBadge = (license: LicenseStatus) => {
    console.log(license);
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
        return <Badge variant="default">Seat Based</Badge>;
      case "KEY_BASED":
        return <Badge variant="outline">Key Based</Badge>;
    }
  };
  const formatDate = (dateString: Date | undefined) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString();
  };

  const isKeyBased = (license: License) => license.licenseKeys.length > 0;

  return (
    <Tabs defaultValue="licenses" className="w-full flex-col gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search licenses..."
              value={search}
              onChange={(e) =>
                updateParams({ search: e.target.value, page: 1 })
              }
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
              <SelectItem value="LIMITED">Limited</SelectItem>
              <SelectItem value="FULL">Full</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={type}
            onValueChange={(value) => updateParams({ status: value, page: 1 })}
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

        <CreateLicenseDrawer>
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
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>License Name</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data || isValidating ? (
                <TableSkeleton rows={5} cols={8} />
              ) : data?.data.length ? (
                data.data.map((license) => (
                  <TableRow key={license.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{license.name}</span>
                        {license.description && (
                          <span className="text-sm text-muted-foreground">
                            {license.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{license.vendor}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {license._count?.licenseKeys || 0} /{" "}
                          {license.totalSeats}
                        </span>
                        <div className="w-16 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${
                                ((license._count?.licenseKeys || 0) /
                                  license.totalSeats) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(license.cost)}</TableCell>
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
                            swrKey={swrKey}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <IconEdit className="h-4 w-4 mr-2" />
                              Edit License
                            </DropdownMenuItem>
                          </UpdateLicenseDrawer>

                          {license.type === "KEY_BASED" && (
                            <ManageLicenseKeysDrawer
                              license={license}
                              swrKey={swrKey}
                            >
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <IconKey className="h-4 w-4 mr-2" />
                                Manage Keys
                              </DropdownMenuItem>
                            </ManageLicenseKeysDrawer>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Delete License
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
