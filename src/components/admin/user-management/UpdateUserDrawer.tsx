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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import useSWR from "swr";

import { updateUserAction } from "@/actions/user-management/action";
import { Manager, User } from "@/lib/types/user";
import { formatDateTime } from "@/lib/utils/formatDateTime";
import { fetcher } from "@/lib/fetcher";

interface UpdateUserDrawerProps {
  user: User;
  children: React.ReactNode;
  mutate: () => void;
}

export function UpdateUserDrawer({
  user,
  children,
  mutate,
}: UpdateUserDrawerProps) {
  const isMobile = useIsMobile();

  const initialState = { success: false, error: "" };
  const [state, updateUser, pending] = React.useActionState(
    updateUserAction,
    initialState
  );

  const [formData, setFormData] = React.useState({
    name: user.name,
    email: user.email,
    department: user.department,
    role: user.role,
    position: user.position || "",
    managerId: user.manager?.id || "none",
  });

  const { data: manager, isLoading } = useSWR<Manager[]>(
    `/api/user-management/managers`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  React.useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success("User is updated Successfully!!");
      mutate();
    }
  }, [state]);

  const filteredManagers = React.useMemo(
    () => manager?.filter((m) => m.department === formData.department),
    [manager, formData.department]
  );

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="h-full max-h-[100vh]">
        <DrawerHeader>
          <DrawerTitle>Update User</DrawerTitle>
          <DrawerDescription>
            Update the details of the user below.
          </DrawerDescription>
        </DrawerHeader>

        <form
          action={updateUser}
          className="flex flex-col gap-4 px-4 py-2 overflow-y-auto"
        >
          {/* Id section */}
          <input type="hidden" name="id" value={user.id} />

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
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

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              disabled={pending}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {/* Department & Role */}
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                name="department"
                value={formData.department}
                disabled={pending}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    department: v as User["department"],
                  })
                }
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                name="role"
                value={formData.role}
                disabled={pending}
                onValueChange={(v) =>
                  setFormData({ ...formData, role: v as User["role"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ACCOUNT_OWNER">Account Owner</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              name="position"
              disabled={pending}
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
            />
          </div>

          {/* Manager & Added By */}
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor="managerId">Manager</Label>
              <Select
                name="managerId"
                value={
                  !formData.department ||
                  formData.role === "ACCOUNT_OWNER" ||
                  formData.role === "MANAGER"
                    ? "none"
                    : formData.managerId
                }
                disabled={
                  isLoading ||
                  !formData.department ||
                  formData.role === "ACCOUNT_OWNER" ||
                  formData.role === "MANAGER"
                }
                onValueChange={(v) =>
                  setFormData({ ...formData, managerId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {filteredManagers?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex-1 overflow-hidden">
                        <span className="block truncate text-sm">
                          {m.name} ({m.department})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Added By</Label>
              <Input
                value={user.addedBy?.name ?? "—"}
                readOnly
                className="text-md cursor-not-allowed block truncate "
              />
            </div>
          </div>

          {/* Joined & Last Updated */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Joined At</Label>
              <span className="text-sm text-muted-foreground">
                {formatDateTime(user.createdAt)}
              </span>
            </div>
            <div className="space-y-2">
              <Label>Last Updated At</Label>
              <span className="text-sm text-muted-foreground">
                {formatDateTime(user.updatedAt)}
              </span>
            </div>
          </div>

          <DrawerFooter className="px-0 pb-0 flex flex-col gap-2 mt-4">
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Saving..." : "Update User"}
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
