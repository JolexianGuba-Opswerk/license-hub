"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
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
import { userSchema } from "@/schemas/users";

interface UserDrawerProps {
  user: z.infer<typeof userSchema>;
  children: React.ReactNode;
}

export function UserDrawer({ user, children }: UserDrawerProps) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="h-full max-h-[100vh]">
        <DrawerHeader>
          <DrawerTitle className="text-lg font-semibold">
            Edit Employee
          </DrawerTitle>
          <DrawerDescription>Update employee details below</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-6 px-4 py-2 overflow-y-auto">
          <EditMode user={user} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function EditMode({ user }: { user: z.infer<typeof userSchema> }) {
  const managers = [
    { id: "1", name: "Alice Johnson" },
    { id: "2", name: "Bob Smith" },
    { id: "3", name: "Charlie Brown" },
  ];

  return (
    <form className="space-y-4">
      {/* Name & Email */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" defaultValue={user.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" defaultValue={user.email} required />
      </div>

      {/* Department & Role */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select defaultValue={user.department}>
            <SelectTrigger id="department">
              <SelectValue placeholder="Select department" />
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
          <Select defaultValue={user.role}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
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

      {/* Position & Manager */}
      <div className="space-y-2">
        <Label htmlFor="position">Position</Label>
        <Input id="position" defaultValue={user.position} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager">Manager</Label>
        <Select defaultValue={user.manager?.id || ""}>
          <SelectTrigger id="manager">
            <SelectValue placeholder="Select manager" />
          </SelectTrigger>
          <SelectContent>
            {managers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
            <SelectItem value="No">No manager</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="space-y-2">
          <Label>Joined At</Label>
          <span className="text-sm text-muted-foreground">
            {new Date(user.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="space-y-2">
          <Label>Last Updated At</Label>
          <span className="text-sm text-muted-foreground">
            {new Date(user.updatedAt).toLocaleString()}
          </span>
        </div>
      </div>

      <DrawerFooter className="px-0 pb-0">
        <Button type="submit" className="w-full mb-2">
          Save Changes
        </Button>
      </DrawerFooter>
    </form>
  );
}
