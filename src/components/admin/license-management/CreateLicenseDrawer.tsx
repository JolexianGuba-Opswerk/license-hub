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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createLicenseAction } from "@/actions/license-management/license/action";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDateTime } from "@/lib/utils/formatDateTime";
import { CreateLicense } from "@/lib/schemas/license-management/license";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
interface CreateLicenseDrawerProps {
  children: React.ReactNode;
  mutate: () => void;
}

export function CreateLicenseDrawer({
  children,
  mutate,
}: CreateLicenseDrawerProps) {
  const isMobile = useIsMobile();
  const [pending, setIsPending] = React.useState(false);
  const [formData, setFormData] = React.useState<CreateLicense>({
    name: "",
    vendor: "",
    description: "",
    totalSeats: 1,
    cost: 0,
    expiryDate: "",
    type: "SEAT_BASED",
    owner: "ITSG",
  });

  const resetForm = () =>
    setFormData({
      name: "",
      vendor: "",
      description: "",
      totalSeats: 1,
      cost: 0,
      expiryDate: "",
      type: "SEAT_BASED",
      owner: "ITSG",
    });

  const handSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const response = await createLicenseAction(formData).finally(() => {
        setIsPending(false);
      });
      if (response.error) {
        toast.error(response.error);
      } else if (response.success) {
        toast.success("License created successfully!");
        mutate();
        resetForm();
      }
    } catch {
      toast.error("Something went wrong in saving");
    }
  };
  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="h-full max-h-[100vh]">
        <DrawerHeader>
          <DrawerTitle>Create New License</DrawerTitle>
          <DrawerDescription>
            Add a new software license to the system.
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={handSubmit}
          className="flex flex-col gap-4 px-4 py-2 overflow-y-auto"
        >
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
              placeholder="e.g., Microsoft Office 365"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor *</Label>
            <Input
              name="vendor"
              id="vendor"
              required
              disabled={pending}
              value={String(formData.vendor)}
              onChange={(e) =>
                setFormData({ ...formData, vendor: e.target.value })
              }
              placeholder="e.g., Microsoft"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              name="description"
              id="description"
              disabled={pending}
              value={String(formData.description)}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of the license..."
            />
          </div>

          <div className="grid gap-4 grid-cols-2">
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
                  setFormData({ ...formData, cost: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="space-y-2 w-full ">
            <Label htmlFor="department">Owner</Label>
            <Select
              name="department"
              value={formData.owner}
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  owner: v as CreateLicense["owner"],
                })
              }
            >
              <SelectTrigger className="w-full m">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ITSG">ITSG</SelectItem>
                <SelectItem value="SRE">SRE</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="SSED">SSED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid  gap-4">
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
                    fromYear={2020}
                    toYear={2040}
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

          {formData.type === "KEY_BASED" && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="text-sm font-medium mb-2">
                Key-based License Settings
              </div>
              <div className="text-sm text-muted-foreground">
                You can add license keys after creating the license. The number
                of keys cannot exceed the total seats available.
              </div>
            </div>
          )}

          <DrawerFooter className="px-0 pb-0 flex flex-col gap-2">
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Creating..." : "Create License"}
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
