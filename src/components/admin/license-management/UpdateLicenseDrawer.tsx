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
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils/formatDateTime";
import {
  CreateLicense,
  License,
} from "@/lib/schemas/license-management/license";
import { updateLicenseAction } from "@/actions/license-management/license/action";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";

interface UpdateLicenseDrawerProps {
  children: React.ReactNode;
  license: License;
  mutate: () => void;
}

export function UpdateLicenseDrawer({
  children,
  license,
  mutate,
}: UpdateLicenseDrawerProps) {
  const isMobile = useIsMobile();
  const [pending, setIsPending] = React.useState(false);
  const [canEditAvailableSeats, setCanEditAvailableSeats] =
    React.useState(false);

  const formatUser = (user: License["licenseAddedBy"]): string => {
    if (!user) return "N/A";
    return `${user.name} - ${user.department} - ${user.role}`;
  };

  const [formData, setFormData] = React.useState<CreateLicense>({
    id: license.id,
    name: license.name || "",
    vendor: license.vendor || "",
    description: license.description || "",
    totalSeats: license.totalSeats || 1,
    cost: license.cost || 0,
    expiryDate: String(license?.expiryDate),
    type: license.type,
    availableSeats: license.availableSeats || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    const response = await updateLicenseAction(formData).finally(() => {
      setIsPending(false);
    });
    if (response.error) {
      toast.error(response.error);
    } else if (response.success) {
      toast.success("License updated successfully!");
      mutate();
    }
    try {
    } catch {
      toast.error("Something went wrong in updating");
    }
  };

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
          onSubmit={handleSubmit}
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
              <Label htmlFor="availableSeats">Available Seats *</Label>
              <div className="flex gap-2">
                <Input
                  name="availableSeats"
                  id="availableSeats"
                  type="number"
                  required
                  disabled={pending || !canEditAvailableSeats}
                  value={formData.availableSeats}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      availableSeats: parseInt(e.target.value) || 0,
                    })
                  }
                />
                {!canEditAvailableSeats && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to edit Available Seats?"
                        )
                      ) {
                        setCanEditAvailableSeats(true);
                      }
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  setFormData({ ...formData, cost: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-left"
                    disabled={pending}
                  >
                    {formData.expiryDate
                      ? formatDateTime(formData.expiryDate)
                      : "Select expiry date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={new Date(formData.expiryDate)}
                    onSelect={(date) =>
                      setFormData({
                        ...formData,
                        expiryDate: date
                          ? date.toISOString().split("T")[0]
                          : "",
                      })
                    }
                    className="rounded-md border"
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between space-y-2 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="type" className="text-base">
                Key-based License
              </Label>
              <div className="text-sm text-muted-foreground">
                Enable if this license requires individual keys
              </div>
            </div>
            <Switch
              id="isKeyBased"
              name="isKeyBased"
              checked={formData.type === "KEY_BASED"}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  type: checked ? "KEY_BASED" : "SEAT_BASED",
                })
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
