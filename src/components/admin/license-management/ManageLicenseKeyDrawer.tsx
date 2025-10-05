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
import useSWR from "swr";

import { fetcher } from "@/lib/fetcher";
import { IconPlus, IconTrash } from "@tabler/icons-react";

interface ManageLicenseKeysDrawerProps {
  children: React.ReactNode;
  license: any;
  swrKey: string;
}

export function ManageLicenseKeysDrawer({
  children,
  license,
  swrKey,
}: ManageLicenseKeysDrawerProps) {
  const isMobile = useIsMobile();
  const [newKey, setNewKey] = React.useState("");
  const [keys, setKeys] = React.useState(license.licenseKeys || []);

  const { data: licenseData, mutate } = useSWR(
    `/api/license-management/${license.id}`,
    fetcher
  );

  const currentLicense = licenseData || license;
  const currentKeys = licenseData?.licenseKeys || keys;

  const usedSeats = currentKeys.length;
  const availableSeats = currentLicense.totalSeats - usedSeats;

  const addKey = async () => {
    if (!newKey.trim()) {
      toast.error("Please enter a license key");
      return;
    }

    if (usedSeats >= currentLicense.totalSeats) {
      toast.error("No available seats remaining");
      return;
    }

    // In a real app, you would call an API here
    const tempKey = {
      id: `temp-${Date.now()}`,
      key: newKey,
      status: "ACTIVE" as const,
      createdAt: new Date().toISOString(),
    };

    setKeys((prev) => [...prev, tempKey]);
    setNewKey("");
    toast.success("License key added successfully");
  };

  const removeKey = (keyId: string) => {
    setKeys((prev) => prev.filter((key) => key.id !== keyId));
    toast.success("License key removed");
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: "default",
      INACTIVE: "secondary",
      ASSIGNED: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="h-full max-h-[100vh]">
        <DrawerHeader>
          <DrawerTitle>Manage License Keys</DrawerTitle>
          <DrawerDescription>
            {currentLicense.name} - {usedSeats}/{currentLicense.totalSeats}{" "}
            seats used
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-4 py-2 overflow-y-auto">
          {/* Add New Key Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="newKey">Add New License Key</Label>
              <div className="flex gap-2">
                <Input
                  id="newKey"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Enter license key..."
                  disabled={availableSeats <= 0}
                />
                <Button
                  onClick={addKey}
                  disabled={availableSeats <= 0 || !newKey.trim()}
                >
                  <IconPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {availableSeats <= 0 && (
              <div className="text-sm text-destructive">
                No available seats remaining. Increase total seats to add more
                keys.
              </div>
            )}
          </div>

          {/* Keys List */}
          <div className="space-y-2">
            <Label>License Keys ({currentKeys.length})</Label>
            <div className="border rounded-lg">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentKeys.length > 0 ? (
                    currentKeys.map((licenseKey: any) => (
                      <TableRow key={licenseKey.id}>
                        <TableCell className="font-mono text-sm">
                          {licenseKey.key}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(licenseKey.status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(licenseKey.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
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
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No license keys added yet.
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
