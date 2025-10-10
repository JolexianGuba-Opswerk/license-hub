"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Package, Clock } from "lucide-react";
import { processRequestItemAction } from "@/actions/request/action";
import { toast } from "sonner";
import { AddApproverDialog } from "./AddApproverDialog";
import { ApprovalProgress } from "./ApprovalProgress";
import { DeclineDialog } from "./DeclineDialog";
import { RequestItemApproval } from "@prisma/client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

export function RequestItemCard({ item, request, currentUser, mutate }) {
  const [isSaving, setIsSaving] = useState(false);
  const [processingItem, setProcessingItem] = useState<string | null>(null);

  const approveItem = async () => {
    setProcessingItem(item.id);
    setIsSaving(true);

    const myApproval = item.approvals.find(
      (a: RequestItemApproval) => a.approverId === currentUser?.id
    );
    if (!myApproval) return;

    const response = await processRequestItemAction({
      requestItemId: item.id,
      approvalId: myApproval.id,
      decision: "APPROVED",
    }).finally(() => setIsSaving(false));

    if (response.error) {
      toast.error(response.error || "Something went wrong");
    } else {
      toast.success("Approved Successfully");
      mutate();
    }
  };

  return (
    <div className="p-6 border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-xl font-semibold">
            {item.license?.name ||
              item.requestedLicenseName ||
              "New License Request"}
          </h3>
          <Badge variant="outline">
            {item.license?.owner ? ` ${item.license?.owner}` : "New Item"}
          </Badge>
          <Badge variant="secondary">
            {item.status.charAt(0).toUpperCase() +
              item.status.slice(1).toLowerCase()}
          </Badge>
        </div>
        {currentUser?.user_metadata?.department === "ITSG" &&
          item.status === "PENDING" && (
            <AddApproverDialog
              requestItemId={item.id}
              currentApprovers={item.approvals}
            />
          )}
      </div>

      <Separator className="my-4" />

      {/* Approval Progress */}
      <ApprovalProgress approvals={item.approvals} />

      {/* Justification */}
      {item.justification && (
        <div className="mb-4">
          <Label className="text-sm font-medium">Business Justification</Label>
          <p className="text-sm mt-2 p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
            {item.justification}
          </p>
        </div>
      )}

      <Separator className="my-4" />

      {/* Actions / Status */}

      {item.canTakeAction ? (
        // Approver view
        <div className="flex gap-3 pt-2">
          <Button
            onClick={approveItem}
            className="flex-1"
            disabled={processingItem === item.id || isSaving}
          >
            {processingItem === item.id || isSaving
              ? "Processing..."
              : "Approve"}
          </Button>
          <DeclineDialog
            item={item}
            mutate={mutate}
            currentUser={currentUser}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
          />
        </div>
      ) : (
        // Requester or Viewer view
        <div className="pt-2">
          {item.status === "APPROVED" && (
            <Alert className="border-green-200 bg-green-50 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Approved</AlertTitle>
              <AlertDescription>
                This request item has been approved.
              </AlertDescription>
            </Alert>
          )}

          {item.status === "DENIED" && (
            <Alert className="border-red-200 bg-red-50 text-red-700">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Declined</AlertTitle>
              <AlertDescription>
                {item.declineReason
                  ? `Reason: ${item.declineReason}`
                  : "This request item was declined."}
              </AlertDescription>
            </Alert>
          )}

          {item.status === "PENDING" && (
            <Alert className="border-gray-200 bg-gray-50 text-gray-700">
              <Clock className="h-4 w-4" />
              <AlertTitle>Pending</AlertTitle>
              <AlertDescription>Waiting for approval...</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
