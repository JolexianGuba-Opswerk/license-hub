"use client";

import * as React from "react";
import useSWR from "swr";

import { useSearchParams, useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Pagination } from "@/components/Pagination";
import { CreateUserDrawer } from "@/components/admin/user-management/CreateUserDrawer";
import { UpdateUserDrawer } from "@/components/admin/user-management/UpdateUserDrawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { IconSearch, IconPlus, IconDotsVertical } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetcher } from "@/lib/fetcher";

export default function UserManagementTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") || 1);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "ALL";
  const department = searchParams.get("department") || "ALL";
  const swrKey = `/api/user-management?page=${page}&search=${search}&role=${role}&department=${department}`;
  console.log("Main Table :", swrKey);
  const updateParams = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.replace(params.toString() ? `?${params.toString()}` : "");
  };

  const { data, isValidating } = useSWR(swrKey, fetcher);

  return (
    <Tabs defaultValue="users" className="w-full flex-col gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) =>
                updateParams({ search: e.target.value, page: 1 })
              }
              className="pl-9"
            />
          </div>

          <Select
            value={department}
            onValueChange={(value) =>
              updateParams({ department: value, page: 1 })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              <SelectItem value="ITSG">ITSG</SelectItem>
              <SelectItem value="SRE">SRE</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="SSED">SSED</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={role}
            onValueChange={(value) => updateParams({ role: value, page: 1 })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="ACCOUNT_OWNER">Account Owner</SelectItem>
              <SelectItem value="FINANCE">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CreateUserDrawer>
          <Button variant="outline" size="sm">
            <IconPlus className="h-4 w-4" />
            <span className="hidden lg:inline ml-2">Add User</span>
          </Button>
        </CreateUserDrawer>
      </div>

      <TabsContent
        value="users"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data || isValidating ? (
                <TableSkeleton />
              ) : data.data.length ? (
                data.data.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <UpdateUserDrawer user={user} swrKey={swrKey}>
                        <Button variant="link" className="px-0 text-left">
                          {user.name}
                        </Button>
                      </UpdateUserDrawer>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell
                      className={
                        user.manager?.name ? "" : "text-foreground-muted"
                      }
                    >
                      {user.manager?.name || "No assigned manager"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDotsVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-foreground-muted"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          page={page}
          totalPages={data?.meta.totalPages || 1}
          total={data?.meta.total || 0}
          onPageChange={(newPage) => updateParams({ page: newPage })}
        />
      </TabsContent>
    </Tabs>
  );
}
