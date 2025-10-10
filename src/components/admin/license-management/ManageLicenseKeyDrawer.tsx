"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import useSWR, { mutate as globalMutate } from "swr";

import { fetcher } from "@/lib/fetcher";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { License, LicenseKey } from "@/lib/schemas/license-management/license";
import { LicenseKeyStatus } from "@prisma/client";
import { addLicenseKeyAction } from "@/actions/license-management/license-key/action";
import { TableSkeleton } from "@/components/TableSkeleton";

interface ManageLicenseKeysDrawerProps {
  children: React.ReactNode;
  license: License;
  tableSWRKey?: string;
}

export function ManageLicenseKeysDrawer({
  children,
  license,
  tableSWRKey,
}: ManageLicenseKeysDrawerProps) {
  const isMobile = useIsMobile();
  const [newKey, setNewKey] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

  const {
    data: licenseData,
    mutate,
    isLoading,
  } = useSWR<License>(
    `/api/license-management/manage-keys/${license.id}`,
    fetcher
  );

  const currentLicense = license;
  const keys = licenseData?.licenseKeys || [];

  const addKey = async () => {
    setIsAdding(true);
    if (!newKey.trim()) {
      toast.error("Please enter a license key");
      return;
    }

    const response = await addLicenseKeyAction(license.id, newKey).finally(() =>
      setIsAdding(false)
    );
    mutate();
    globalMutate(tableSWRKey);
    if (response.error) {
      toast.error(response.error);
    } else if (response.success) {
      toast.success("License key added successfully");
      setNewKey("");
    }
  };

  const removeKey = async (keyId: string) => {
    mutate((prev: License | undefined) => {
      if (!prev) return prev; // handle empty state
      return {
        ...prev,
        licenseKeys: prev.licenseKeys.filter((k: LicenseKey) => k.id !== keyId),
      };
    }, false);

    // TODO: DELETE API call

    mutate();

    toast.success("License key removed");
  };

  const updateStatus = async (keyId: string, status: LicenseKeyStatus) => {
    mutate((prev: License | undefined) => {
      if (!prev) return prev; // handle empty cache
      return {
        ...prev,
        licenseKeys: prev.licenseKeys.map((k: LicenseKey) =>
          k.id === keyId ? { ...k, status } : k
        ),
      };
    }, false);

    // TODO: API call

    mutate();
    toast.success(`Status updated to ${status}`);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: "default",
      INACTIVE: "secondary",
      ASSIGNED: "outline",
      REVOKED: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  return (
    <Drawer direction={isMobile ? "bottom" : "bottom"}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="  px-50 ">
        <DrawerHeader>
          <DrawerTitle>
            {license.type === "KEY_BASED"
              ? "Manage License Keys"
              : "Manage License Seats"}
          </DrawerTitle>
          <DrawerDescription>
            {currentLicense.name} - {license._count.licenseKeys}/
            {license.totalSeats} seats available
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-4 py-2 overflow-y-auto">
          {/* Add New Key Section */}
          {license.type === "KEY_BASED" && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="newKey">Add New License Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="newKey"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Enter license key..."
                    disabled={
                      license.totalSeats - license._count.licenseKeys <= 0
                    }
                  />
                  <Button
                    onClick={addKey}
                    disabled={
                      license.totalSeats - license._count.licenseKeys <= 0 ||
                      !newKey.trim() ||
                      isAdding
                    }
                  >
                    {isAdding ? "Adding..." : <IconPlus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Keys List */}
          <Label>
            {" "}
            {license.type === "KEY_BASED" ? "License Keys" : "License Seats"} (
            {keys.length})
          </Label>
          <div className="space-y- border rounded-lg max-h-70 overflow-y-auto">
            {" "}
            <div className="border rounded-lg">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    {license.type === "KEY_BASED" && <TableHead>Key</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : keys.length > 0 ? (
                    keys.map((licenseKey: LicenseKey) => (
                      <TableRow key={licenseKey.id}>
                        {license.type === "KEY_BASED" && (
                          <TableCell className="font-mono text-sm">
                            {licenseKey.key}
                          </TableCell>
                        )}

                        <TableCell>
                          <Select
                            value={licenseKey.status}
                            onValueChange={(val) =>
                              updateStatus(
                                licenseKey.id,
                                val as LicenseKeyStatus
                              )
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="INACTIVE">Inactive</SelectItem>
                              <SelectItem value="ASSIGNED">Assigned</SelectItem>
                              <SelectItem value="REVOKED">Revoked</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(licenseKey.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {licenseKey.addedBy
                            ? `${licenseKey.addedBy.name} - ${licenseKey.addedBy.department}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {licenseKey.assignedTo ? (
                            <span>{licenseKey.assignedTo.name}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeKey(licenseKey.id)}
                            disabled={licenseKey.status === "ASSIGNED"}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {license.type === "KEY_BASED"
                          ? " No license keys added yet."
                          : "No seats assigned yet"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <DrawerFooter className="px-4 pb-4">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
