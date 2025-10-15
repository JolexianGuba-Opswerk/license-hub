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
import { IconTrash } from "@tabler/icons-react";
import { License } from "@/lib/schemas/license-management/license";
import { LicenseKeyStatus } from "@prisma/client";
import { addLicenseKeyAction } from "@/actions/license-management/license-key/action";
import { TableSkeleton } from "@/components/TableSkeleton";
import { formatDateTime } from "@/lib/utils/formatDateTime";

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

  const { data, mutate, isLoading, error } = useSWR(
    `/api/license-management/manage-keys/${license.id}`,
    fetcher
  );

  const keys = data?.licenseKeys ?? [];

  const addKey = async () => {
    if (!newKey.trim()) return toast.error("Please enter a license key");

    setIsAdding(true);
    try {
      const response = await addLicenseKeyAction(license.id, newKey);
      if (response.error) throw new Error(response.error);
      toast.success("License key added successfully");
      setNewKey("");
      mutate();
      globalMutate(tableSWRKey);
    } catch (err: any) {
      toast.error(err.message || "Failed to add license key");
    } finally {
      setIsAdding(false);
    }
  };

  const removeKey = async (keyId: string) => {
    // TODO: call DELETE API
    mutate(
      (prev) =>
        prev
          ? {
              ...prev,
              licenseKeys: prev.licenseKeys.filter((k) => k.id !== keyId),
            }
          : prev,
      false
    );
    toast.success("License key removed");
  };

  const updateStatus = async (keyId: string, status: LicenseKeyStatus) => {
    // TODO: call PATCH API
    mutate(
      (prev) =>
        prev
          ? {
              ...prev,
              licenseKeys: prev.licenseKeys.map((k) =>
                k.id === keyId ? { ...k, status } : k
              ),
            }
          : prev,
      false
    );
    toast.success(`Status updated to ${status}`);
  };

  return (
    <Drawer direction={isMobile ? "bottom" : "bottom"}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="p-0 max-h-[85vh] flex flex-col">
        <DrawerHeader className="pb-2 border-b">
          <DrawerTitle>
            {license.type === "KEY_BASED"
              ? "Manage License Keys"
              : "Manage License Seats"}
          </DrawerTitle>
          <DrawerDescription>
            {license.name} — {data?._count?.licenseKeys ?? 0}/
            {license.totalSeats} in use
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Add Key Section */}
          {license.type === "KEY_BASED" && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <Label>Add New License Key</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter license key..."
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  disabled={isAdding}
                />
                <Button onClick={addKey} disabled={isAdding || !newKey.trim()}>
                  {isAdding ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>
          )}

          {/* Keys List */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    {license.type === "KEY_BASED" && <TableHead>Key</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="w-24 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-destructive"
                      >
                        Failed to load license keys
                      </TableCell>
                    </TableRow>
                  ) : keys.length > 0 ? (
                    keys.map((k) => (
                      <TableRow key={k.id}>
                        {license.type === "KEY_BASED" && (
                          <TableCell className="font-mono text-xs">
                            {k.key}
                          </TableCell>
                        )}
                        <TableCell>
                          <Select
                            value={k.status}
                            onValueChange={(val) =>
                              updateStatus(k.id, val as LicenseKeyStatus)
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="INACTIVE">Inactive</SelectItem>
                              <SelectItem value="ASSIGNED">Assigned</SelectItem>
                              <SelectItem value="REVOKED">Revoked</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(k.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {k.addedBy
                            ? `${k.addedBy.name} (${k.addedBy.department})`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {k.assignedUser?.name
                            ? `${k.assignedUser?.name} (${k.assignedUser?.department})`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeKey(k.id)}
                            disabled={k.status === "ASSIGNED"}
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
                        className="text-center text-muted-foreground py-6"
                      >
                        {license.type === "KEY_BASED"
                          ? "No license keys added yet."
                          : "No seats assigned yet."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t p-4">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
