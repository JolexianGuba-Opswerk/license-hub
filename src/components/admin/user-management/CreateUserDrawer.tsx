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
import { createUserAction } from "@/actions/user-management/action";

import { Manager } from "@/lib/types/user";
import { fetcher } from "@/lib/fetcher";

interface CreateUserDrawerProps {
  children: React.ReactNode;
  mutate: () => void;
}

export function CreateUserDrawer({ children, mutate }: CreateUserDrawerProps) {
  const isMobile = useIsMobile();
  const initialState = { success: false, error: "" };

  const [state, formAction, pending] = React.useActionState(
    createUserAction,
    initialState
  );

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    department: "",
    role: "EMPLOYEE" as Manager["role"],
    position: "",
    managerId: "none",
  });

  const resetForm = () =>
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "EMPLOYEE" as Manager["role"],
      department: "",
      position: "",
      managerId: "none",
    });

  const { data: manager, isLoading } = useSWR<Manager[]>(
    `/api/user-management/managers`,
    fetcher
  );

  React.useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success("User is created Successfully!!");
      mutate();
      resetForm();
    }
  }, [state]);

  const filteredManagers = React.useMemo(
    () => manager?.filter((m) => m.department === formData.department),
    [manager, formData.department]
  );

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className=" h-full max-h-[100vh]">
        <DrawerHeader>
          <DrawerTitle>Create New User</DrawerTitle>
          <DrawerDescription>
            Fill in the details below to add a new user.
          </DrawerDescription>
        </DrawerHeader>

        <form
          action={formAction}
          className="flex flex-col gap-4 px-4 py-2 overflow-y-auto"
        >
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

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              name="email"
              id="email"
              type="email"
              required
              disabled={pending}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              name="password"
              id="password"
              type="password"
              required
              disabled={pending}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 w-full ">
              <Label htmlFor="department">Department</Label>
              <Select
                name="department"
                value={formData.department}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    department: v as Manager["department"],
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
                  <SelectItem value="FINANCE">FINANCE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 w-full">
              <Label htmlFor="position">Role</Label>
              <Select
                name="role"
                value={formData.role}
                onValueChange={(v) =>
                  setFormData({ ...formData, role: v as Manager["role"] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ACCOUNT_OWNER">Account Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              name="position"
              id="position"
              disabled={pending}
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
            />
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="managerId">Manager</Label>
            <Select
              name="managerId"
              value={
                isLoading ||
                !formData.department ||
                formData.role === "ACCOUNT_OWNER" ||
                formData.role === "MANAGER"
                  ? "none" // always send "none" when disabled
                  : formData.managerId
              }
              disabled={
                !formData.department ||
                formData.role === "ACCOUNT_OWNER" ||
                formData.role === "MANAGER"
              }
              onValueChange={(v) => setFormData({ ...formData, managerId: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Manager</SelectItem>
                {filteredManagers?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DrawerFooter className="px-0 pb-0 flex flex-col gap-2">
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Creating..." : "Create User"}
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
