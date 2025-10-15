"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { XCircle } from "lucide-react";
import { RequestItemApproval } from "@prisma/client";
import { processRequestItemAction } from "@/actions/request/action";
import { toast } from "sonner";

export function DeclineDialog({
  item,
  mutate,
  currentUser,
  isSaving,
  setIsSaving,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);
  console.log("initial render", item.approvals);
  const handleDecline = async () => {
    if (!reason) return;

    setProcessing(true);
    setIsSaving(true);
    console.log("onclick render", item.approvals);
    console.log("2onclick render", currentUser.id);
    const myApproval = item.approvals.find(
      (a: RequestItemApproval) => a.approverId === currentUser?.id
    );

    if (!myApproval) {
      toast.error("You are not authorized to decline this item");
      setProcessing(false);
      setIsSaving(false);
      return;
    }

    try {
      const response = await processRequestItemAction({
        requestItemId: item.id,
        approvalId: myApproval.id,
        reason,
        decision: "DENIED",
      });

      if (response.success) {
        toast.success("Request item declined successfully");
        mutate();
        setIsOpen(false); // Close the dialog
      } else {
        toast.error(response.error || "Something went wrong");
      }
    } catch (err) {
      toast.error("Failed to decline request item");
      console.error(err);
    } finally {
      setProcessing(false);
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="flex-1 w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          disabled={isSaving || processing}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Decline
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline License Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for declining this item..."
            className="min-h-[120px]"
          />
          <div className="flex gap-2 justify-end">
            <Button
              disabled={processing}
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="max-w-28"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={!reason || processing}
              className="max-w-36"
            >
              {processing ? "Processing..." : "Confirm Decline"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
