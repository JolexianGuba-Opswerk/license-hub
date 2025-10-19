"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/supabase-client";
import { fetcher } from "@/lib/fetcher";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AssignmentItemCard } from "@/components/admin/license-assignment/AssignmentItemCard";
import { RequestDetailsSkeleton } from "@/components/admin/request/RequestDetailsSkeleton";
import { formatDateTime } from "@/lib/utils/formatDateTime";
import ForbiddenAccessPage from "@/components/ForbiddenAccessPage";

export default function AssignmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<any>(null);

  const {
    data: assignment,
    mutate,
    isLoading,
  } = useSWR(`/api/license-assignment/${id}`, fetcher);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) router.push("/login");
      setCurrentUser(user);
    };
    fetchUser();
  }, [supabase, router]);

  if (isLoading) return <RequestDetailsSkeleton />;

  if (
    assignment?.error === "Forbidden" ||
    assignment?.error === "Unauthorized"
  ) {
    return (
      <ForbiddenAccessPage
        title="Access Restricted"
        message="    You don’t have the required permissions to access this page. If you
          believe this is a mistake, please contact your administrator."
        showBackButton={true}
      />
    );
  }

  return (
    <div className="container mx-auto w-full p-10 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/assign")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Assignment Details</h1>
            <p className="text-sm text-muted-foreground">
              Request ID: {assignment.requestId}
            </p>
          </div>
        </div>

        <Badge className="px-3 py-1 text-base capitalize">
          {assignment.status}
        </Badge>
      </motion.div>

      {/* Employee Info */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Employee</p>
            <p className="font-semibold">{assignment.employeeName}</p>
            <p className="text-sm">{assignment.employeeEmail}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Department</p>
            <p className="font-semibold">{assignment.department}</p>
            <p className="text-sm">Manager: {assignment.managerName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Approved At</p>
            <p className="font-semibold">
              {formatDateTime(assignment.approvedAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* License Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignment.items.map((item) => (
          <AssignmentItemCard
            key={item.id}
            item={item}
            mutate={mutate}
            assignmentId={assignment.id}
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
}
