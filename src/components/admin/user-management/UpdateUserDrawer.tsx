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
  const [emailGuardEnabled, setEmailGuardEnabled] = React.useState(true);
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
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2 w-full">
                {/* Visible Input (guarded) */}
                <Input
                  id="email"
                  name="email_disabled"
                  type="email"
                  className="w-full"
                  disabled={pending || emailGuardEnabled}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                  }}
                />

                {/* Hidden Input (always submitted) */}
                <input type="hidden" name="email" value={formData.email} />

                {/* Change Email Button */}
                {emailGuardEnabled && (
                  <Button
                    disabled={pending}
                    type="button"
                    variant="outline"
                    className="w-30"
                    onClick={() => {
                      if (confirm("Are you sure you want to edit the email?")) {
                        setEmailGuardEnabled(false);
                      }
                    }}
                  >
                    Change Email
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Department & Role */}
          <div className="grid grid-cols-2 mt-3 gap-4">
            {/* Department */}
            <div className="space-y-2 w-full">
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="ITSG">ITSG</SelectItem>
                  <SelectItem value="SRE">SRE</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="SSED">SSED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div className="space-y-2 w-full">
              <Label htmlFor="role">Role</Label>
              <Select
                name="role"
                value={formData.role}
                disabled={pending}
                onValueChange={(v) =>
                  setFormData({ ...formData, role: v as User["role"] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ACCOUNT_OWNER">Account Owner</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
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
            <div className="space-y-2 w-full">
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="none">No Manager</SelectItem>
                  {filteredManagers?.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="w-50">
                      <span className="block truncate max-w-[120px] text-sm">
                        {m.name} ({m.department})
                      </span>
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
