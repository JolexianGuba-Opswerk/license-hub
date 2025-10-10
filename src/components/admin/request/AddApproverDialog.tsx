// components/admin/request/AddApproverDialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { addApproverToRequestItem } from "@/actions/request/action";
import { toast } from "sonner";
import { ApprovalLevel } from "@prisma/client";

interface AddApproverDialogProps {
  requestItemId: string;
  currentApprovers: any[];
}

export function AddApproverDialog({
  requestItemId,
  currentApprovers,
}: AddApproverDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<ApprovalLevel>("ITSG");
  const [isAdding, setIsAdding] = useState(false);

  const { data: approvers, mutate } = useSWR(`/api/request/approver`, fetcher);

  // TO AVOID SELECTING OWN ID
  const filteredApprovers = approvers?.filter(
    (approver) =>
      !currentApprovers.some((current) => current.approverId === approver.id)
  );

  const handleAddApprover = async () => {
    if (!selectedApprover || !selectedLevel) return;

    setIsAdding(true);
    try {
      const response = await addApproverToRequestItem(requestItemId, {
        approverId: selectedApprover,
        level: selectedLevel,
      });

      if (response.error) {
        toast.error(response.error || "Something went wrong");
      } else {
        toast.success("Added Succesfully");
        mutate(`/api/request/${requestItemId}`);
      }

      // Reset and close
      setSelectedApprover("");
      setSelectedLevel("ITSG");
      setOpen(false);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Approver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Approver</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Approver Selection */}
          <div className="space-y-2">
            <Label htmlFor="approver">Select Approver *</Label>
            <Select
              value={selectedApprover}
              onValueChange={setSelectedApprover}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an approver" />
              </SelectTrigger>
              <SelectContent>
                {filteredApprovers?.map((approver) => (
                  <SelectItem key={approver.id} value={approver.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{approver.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {approver.email} • {approver.role}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Level Selection */}
          <div className="space-y-2">
            <Label htmlFor="level">Approval Level *</Label>
            <Select
              value={selectedLevel}
              onValueChange={(val) => setSelectedLevel(val as ApprovalLevel)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="ITSG">ITSG</SelectItem>
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground">
              Select the approval level for this approver
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setSelectedApprover("");
                setSelectedLevel("ITSG");
              }}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddApprover}
              disabled={!selectedApprover || !selectedLevel || isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Approver"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
