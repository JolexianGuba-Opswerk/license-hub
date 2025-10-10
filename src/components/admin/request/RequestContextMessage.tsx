"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";

interface RequestContextMessageProps {
  isRequestOwner: boolean;
  isRequestedFor: boolean;
  isApprover: boolean;
}

export function RequestContextMessage({
  isRequestOwner,
  isRequestedFor,
  isApprover,
}: RequestContextMessageProps) {
  return (
    <Card className="mb-6 border border-blue-200 bg-blue-50">
      <CardContent className="py-4">
        {isRequestOwner && (
          <p className="text-blue-700 text-sm">
            <strong>You</strong> created this request. You can track its
            progress here.
          </p>
        )}

        {isRequestedFor && !isRequestOwner && (
          <p className="text-blue-700 text-sm">
            This request was created on your behalf. You will receive the
            license once approvals are completed.
          </p>
        )}

        {isApprover && (
          <p className="text-blue-700 text-sm">
            You are assigned as an <strong>approver</strong> for one or more
            items in this request. Please review and take action.
          </p>
        )}

        {!isRequestOwner && !isRequestedFor && !isApprover && (
          <p className="text-blue-700 text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" />
            You are viewing this request because you have department-level or
            ITSG access.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
