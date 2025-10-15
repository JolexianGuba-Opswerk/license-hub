"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Filters from "@/components/admin/license-assignment/Filters";
import AssignmentsTable from "@/components/admin/license-assignment/AssignmentTable";
import AssignmentsTableSkeleton from "@/components/admin/license-assignment/AssignmentsTableSkeleton";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export default function AssignmentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: assignments, isLoading } = useSWR(
    "/api/license-assignment",
    fetcher
  );

  // Filter assignments based on search and status
  const filteredAssignments =
    assignments?.filter((assignment) => {
      const matchesSearch =
        assignment.requestedForName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assignment.requesterEmail
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assignment.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        assignment.status === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    }) || [];

  const viewAssignmentDetails = (id: string) => router.push(`/assign/${id}`);
  const startAssignment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/assign/${id}`);
  };

  return (
    <div className="container mx-auto py-6 p-5 space-y-6 p-10">
      <h1 className="text-3xl font-bold mb-1">License Assignments</h1>
      <p className="text-muted-foreground mb-6">
        Manage license assignments for approved requests
      </p>
      <Filters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {isLoading ? (
        <AssignmentsTableSkeleton />
      ) : (
        <>
          {/* <StatsCards assignments={filteredAssignments} /> */}
          <AssignmentsTable
            assignments={filteredAssignments}
            viewAssignmentDetails={viewAssignmentDetails}
            startAssignment={startAssignment}
          />
        </>
      )}
    </div>
  );
}
