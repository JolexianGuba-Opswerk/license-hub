import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle } from "lucide-react";

interface ActionsCardProps {
  procurement;
  isUpdating: boolean;
  onUpdateStatus: (status: string, rejectionReason?: string) => void;
}

export function ActionsCard({
  procurement,
  isUpdating,
  onUpdateStatus,
}: ActionsCardProps) {
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onUpdateStatus("REJECTED", rejectionReason.trim());
      setRejectionDialogOpen(false);
      setRejectionReason("");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            onClick={() => onUpdateStatus("APPROVED")}
            disabled={isUpdating}
            size="lg"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve Request
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setRejectionDialogOpen(true)}
            disabled={isUpdating}
            size="lg"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject Request
          </Button>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Procurement Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this procurement request.
              This will be visible to the requester.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionDialogOpen(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isUpdating}
            >
              {isUpdating ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
