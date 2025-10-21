"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Package, Clock, UserCheck } from "lucide-react";
import { processRequestItemAction } from "@/actions/request/action";
import { toast } from "sonner";
import { AddApproverDialog } from "./AddApproverDialog";
import { ApprovalProgress } from "./ApprovalProgress";
import { DeclineDialog } from "./DeclineDialog";
import { RequestItemApproval } from "@prisma/client";
import { CheckCircle, ShoppingCart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

import { useRouter } from "next/navigation";

export function RequestItemCard({ item, request, currentUser, mutate }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [processingItem, setProcessingItem] = useState<string | null>(null);

  const approveItem = async () => {
    setProcessingItem(item.id);
    setIsSaving(true);

    const myApproval = item.approvals.find(
      (a: RequestItemApproval) => a.approverId === currentUser?.id
    );
    if (!myApproval) return;

    try {
      const response = await processRequestItemAction({
        requestItemId: item.id,
        approvalId: myApproval.id,
        decision: "APPROVED",
      });

      if (!response.success) {
        toast.error(response.error || "Something went wrong");
        return;
      }

      toast.success("Approved Successfully");
      mutate();
    } catch {
      toast.error("Failed to approve request item");
    } finally {
      setIsSaving(false);
      setProcessingItem(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg sm:text-xl font-semibold truncate">
            {item.license?.name ||
              item.requestedLicenseName ||
              "New License Request"}
          </h3>
          <Badge variant="outline" className="text-xs sm:text-sm">
            {item.license?.owner ? ` ${item.license?.owner}` : "New Item"}
          </Badge>
          <Badge variant="secondary" className="text-xs sm:text-sm">
            {item.status.charAt(0).toUpperCase() +
              item.status.slice(1).toLowerCase()}
          </Badge>
        </div>

        {currentUser?.user_metadata?.department === "ITSG" &&
          currentUser?.user_metadata?.role === "TEAM_LEAD" &&
          item.status === "PENDING" && (
            <AddApproverDialog
              mutate={mutate}
              requestItemId={item.id}
              currentApprovers={item.approvals ?? []}
            />
          )}
      </div>

      <Separator className="my-2 sm:my-4" />

      {/* Approval Progress */}
      <ApprovalProgress approvals={item.approvals} />

      {/* Justification */}
      {item.justification && (
        <div className="mb-2 sm:mb-4">
          <Label className="text-sm font-medium flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 3a7 7 0 00-7 7c0 3.866 3.134 7 7 7s7-3.134 7-7a7 7 0 00-7-7z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14v7"
              />
            </svg>
            Business Justification
          </Label>
          <div className="mt-2 p-3 sm:p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded-md shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-yellow-900 whitespace-pre-wrap">
              {item.justification}
            </p>
          </div>
        </div>
      )}

      <Separator className=" sm:my-4" />

      {/* ACTIONS SECTION */}
      {item.needsPurchase &&
        item.canPurchase &&
        item.status !== "PURCHASING" && (
          <div className="pb-2">
            <Alert className="border border-yellow-300 bg-yellow-50 text-yellow-800 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-yellow-600" />
                <div>
                  <AlertTitle className="font-semibold">
                    Needs Purchase
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    No available seats or license keys. Please request a
                    purchase first
                  </AlertDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 sm:mt-0 border-yellow-400 text-yellow-700 hover:bg-yellow-100"
                onClick={() => {
                  const queryParams = new URLSearchParams({
                    requestItemId: item.id,
                    vendor:
                      item?.license?.vendor || item?.requestedLicenseVendor,
                    name: item.license?.name || item?.requestedLicenseName,
                    justification: item.justification,
                    // Add other fields you want to prefill
                  }).toString();
                  router.push(`/procurement/new/?${queryParams}`);
                }}
              >
                Purchase
              </Button>
            </Alert>
          </div>
        )}

      {item.canTakeAction && item.status !== "PURCHASING" ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-2">
            {/* DECLINE BUTTON */}
            {item && (
              <DeclineDialog
                item={item}
                mutate={mutate}
                currentUser={currentUser}
                isSaving={isSaving}
                setIsSaving={setIsSaving}
              />
            )}

            {/* APPROVE BUTTON */}
            <Button
              onClick={approveItem}
              className="flex-1 w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white"
              disabled={processingItem === item.id || isSaving}
            >
              {processingItem === item.id || isSaving ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        // STATUS MESSAGE SECTION
        <div className=" space-y-2">
          {/* Status Messages */}
          {item.status === "APPROVED" && (
            <Alert className="border-green-200 bg-green-50 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Approved</AlertTitle>
              <AlertDescription>
                This request item has been approved and is awaiting license
                assignment.
              </AlertDescription>
            </Alert>
          )}
          {item.status === "ASSIGNING" && (
            <Alert className="border-yellow-200 bg-yellow-50 text-yellow-700">
              <Clock className="h-4 w-4" />
              <AlertTitle>Assigning</AlertTitle>
              <AlertDescription>
                The license key is currently being assigned. Please wait a
                moment.
              </AlertDescription>
            </Alert>
          )}
          {item.status === "REVIEWING" && (
            <Alert className="border-yellow-200 bg-yellow-50 text-yellow-700">
              <Clock className="h-4 w-4" />
              <AlertTitle>Reviewing</AlertTitle>
              <AlertDescription>
                The request is currently being reviewed by other approvers.
              </AlertDescription>
            </Alert>
          )}
          {item.status === "FULFILLED" && (
            <div>
              {item.assignedBy && (
                <Alert className="flex items-center gap-3 px-3 py-2 mb-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-800">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-100">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <AlertTitle className="font-semibold text-sm">
                      Assigned By
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      {item.assignedBy}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <Alert className="border-green-300 bg-green-50 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Fulfilled</AlertTitle>
                <AlertDescription>
                  This request item has been successfully fulfilled. The license
                  key has been assigned.
                </AlertDescription>
              </Alert>
            </div>
          )}
          {item.ProcurementRequest[0]?.rejectionReason && (
            <Alert className="border-red-200 bg-red-50 text-red-700">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Rejected by Finance</AlertTitle>
              <AlertDescription>
                {item.ProcurementRequest[0]?.rejectionReason
                  ? `Reason: ${item.ProcurementRequest[0]?.rejectionReason}`
                  : "This procurement request was rejected by Finance."}
              </AlertDescription>
            </Alert>
          )}
          {item.status === "DENIED" &&
            !item.ProcurementRequest[0]?.rejectionReason && (
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
          {item.status === "PURCHASING" && (
            <Alert className="border-gray-200 bg-gray-50 text-gray-700">
              <Clock className="h-4 w-4" />
              <AlertTitle>Purchasing</AlertTitle>
              <AlertDescription>
                This request is under review and awaiting purchase approval.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
