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

import { toast } from "sonner";
import { updateLicenseAction } from "@/actions/license-management/action";

import { formatDateTime } from "@/lib/utils/formatDateTime";
import { License } from "@/lib/schemas/license-management/license";

interface UpdateLicenseDrawerProps {
  children: React.ReactNode;
  license: License;
  swrKey: string;
}

export function UpdateLicenseDrawer({
  children,
  license,
  swrKey,
}: UpdateLicenseDrawerProps) {
  const isMobile = useIsMobile();
  const initialState = { success: false, error: "" };

  const [state, formAction, pending] = React.useActionState(
    updateLicenseAction,
    initialState
  );
  const formatUser = (user: License["licenseAddedBy"]): string => {
    return `${user.name} - ${user.department} - ${user.role}`;
  };
  const [formData, setFormData] = React.useState({
    name: license.name || "",
    vendor: license.vendor || "",
    description: license.description || "",
    totalSeats: license.totalSeats || 1,
    cost: license.cost?.toString() || "",
    expiryDate: license.expiryDate?.split("T")[0] || "",
  });

  React.useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success("License updated successfully!");
    }
  }, [state]);

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="h-full max-h-[100vh]">
        <DrawerHeader>
          <DrawerTitle>Update License</DrawerTitle>
          <DrawerDescription>
            Make changes to the license details.
          </DrawerDescription>
        </DrawerHeader>

        <form
          action={formAction}
          className="flex flex-col gap-4 px-4 py-2 overflow-y-auto"
        >
          <input type="hidden" name="id" value={license.id} />

          <div className="space-y-2">
            <Label htmlFor="name">License Name *</Label>
            <Input
              id="name"
              name="name"
              required
              disabled={pending}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor *</Label>
            <Input
              name="vendor"
              id="vendor"
              required
              disabled={pending}
              value={formData.vendor}
              onChange={(e) =>
                setFormData({ ...formData, vendor: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              name="description"
              id="description"
              disabled={pending}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalSeats">Total Seats *</Label>
              <Input
                name="totalSeats"
                id="totalSeats"
                type="number"
                min="1"
                required
                disabled={pending}
                value={formData.totalSeats}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalSeats: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                name="cost"
                id="cost"
                type="number"
                step="0.01"
                min="0"
                disabled={pending}
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              name="expiryDate"
              id="expiryDate"
              type="date"
              disabled={pending}
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
            />
          </div>
          <hr className="my-4 border-t border-gray-300" />

          <div className="grid grid-cols-2 gap-4 ">
            <div className="space-y-2">
              <Label htmlFor="totalSeats">Added At *</Label>
              <Input
                type="string"
                disabled={true}
                value={formatDateTime(license.createdAt)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Last Update At *</Label>
              <Input
                type="string"
                disabled={true}
                value={formatDateTime(license.updatedAt)}
              />
            </div>
          </div>

          <div className="space-y-2 ">
            <Label htmlFor="cost">Added By *</Label>
            <Input
              type="string"
              disabled={true}
              value={formatUser(license.licenseAddedBy)}
            />
          </div>

          <DrawerFooter className="px-0 pb-0 flex flex-col gap-2">
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Updating..." : "Update License"}
            </Button>
            <DrawerClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
