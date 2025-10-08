"use client";

import * as React from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Mail,
  Building,
  User,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils/formatDateTime";
import { fetcher } from "@/lib/fetcher";
import { User as UserType } from "@/lib/types/user";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useSWR<UserType>(
    params.id ? `/api/user-management/${params.id}` : null,
    fetcher
  );

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 p-4 text-red-500 border border-red-200 rounded-lg bg-red-50">
          <div className="flex-1">
            ß<h3 className="font-semibold">Failed to load user</h3>
            <p className="text-sm text-red-600">Please try again later</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-full flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
            <p className="text-muted-foreground mt-1">View user information</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            {isLoading ? (
              <div className="w-full space-y-4">
                <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ) : user ? (
              <>
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                <Badge className="mt-3">{user.role}</Badge>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* User Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Detailed information about the user
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <UserDetailSkeleton />
            ) : !user ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">User not found</h3>
                <p className="text-muted-foreground mt-1">
                  The user youre looking for doesnt exist or has been removed.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <DetailSection
                  icon={<User className="h-4 w-4" />}
                  title="Personal Information"
                  fields={[
                    { label: "Email", value: user.email },
                    { label: "Position", value: user.position || "—" },
                    { label: "Role", value: user.role },
                  ]}
                />

                <DetailSection
                  icon={<Building className="h-4 w-4" />}
                  title="Organization"
                  fields={[
                    { label: "Department", value: user.department },
                    { label: "Manager", value: user.manager?.name ?? "—" },
                    { label: "Added By", value: user.addedBy?.name ?? "—" },
                  ]}
                />
                <div className="md:col-span-2">
                  <Separator className="my-5" />
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Timeline
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Joined At
                      </p>
                      <p className="mt-1 text-base font-semibold">
                        {formatDateTime(user.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Last Updated
                      </p>
                      <p className="mt-1 text-base font-semibold">
                        {formatDateTime(user.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* Detail Section Component */
function DetailSection({
  icon,
  title,
  fields,
}: {
  icon: React.ReactNode;
  title: string;
  fields: Array<{
    label: string;
    value: string;
    className?: string;
  }>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-base">{title}</h3>
      </div>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={index}>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {field.label}
            </p>
            <p
              className={`font-semibold text-foreground ${
                field.className || ""
              }`}
            >
              {field.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Skeleton Loader */
function UserDetailSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Personal Information Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-3">
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div>
            <Skeleton className="h-4 w-12 mb-1" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </div>

      {/* Organization Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="space-y-3">
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
      </div>

      {/* Timeline Skeleton */}
      <div className="md:col-span-2 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
