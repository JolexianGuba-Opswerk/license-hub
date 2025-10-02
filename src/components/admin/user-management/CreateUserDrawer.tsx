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
import { User } from "@/components/data-table";
import { createUserAction } from "@/actions/user-management/action";
import { UserType } from "@/schemas/user-management/createUserSchema";

interface CreateUserDrawerProps {
  children: React.ReactNode;
}

export function CreateUserDrawer({ children }: CreateUserDrawerProps) {
  const isMobile = useIsMobile();
  const initialState = { success: false, error: "" };

  const [state, formAction, pending] = React.useActionState(
    createUserAction,
    initialState
  );

  const mockManagers: UserType[] = [
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice@company.com",
      role: "MANAGER",
      department: "ITSG",
      position: "IT Manager",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Bob Smith",
      email: "bob@company.com",
      role: "MANAGER",
      department: "SRE",
      position: "SRE Manager",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Charlie Brown",
      email: "charlie@company.com",
      role: "MANAGER",
      department: "HR",
      position: "HR Manager",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE" as User["role"],
    department: "ITSG" as User["department"],
    position: "",
    managerId: "",
  });

  const resetForm = () =>
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      department: "ITSG",
      position: "",
      managerId: "",
    });

  React.useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success("User is created Successfully!!");
      resetForm();
    }
  }, [state]);

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
            <Select
              name="department"
              value={formData.department}
              onValueChange={(v) => setFormData({ ...formData, department: v })}
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

            <Select
              name="role"
              value={formData.role}
              onValueChange={(v) => setFormData({ ...formData, role: v })}
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

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              name="position"
              id="position"
              required
              disabled={pending}
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <Select
              name="managerId"
              value={formData.managerId}
              onValueChange={(v) => setFormData({ ...formData, managerId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Manager</SelectItem>
                {mockManagers.map((m) => (
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
