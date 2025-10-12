"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  KeyRound,
  Package,
  ShoppingCart,
  User,
  Calendar,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/formatDateTime";

export function AssignmentItemCard({
  item,
  mutate,
  assignmentId,
  currentUser,
}) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [seatLink, setSeatLink] = useState("");

  const handleAssignSeat = async (auto = false) => {
    if (item.availableSeats <= 0) {
      toast.error("No available seats left.");
      return;
    }

    if (!auto && !seatLink.trim()) {
      toast.error("Please provide a link for the seat assignment.");
      return;
    }

    setIsAssigning(true);
    try {
      const res = await fetch(`/api/license-assignment/${assignmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseId: item.licenseId,
          userId: currentUser?.id,
          seatLink: auto ? "Auto-generated link" : seatLink.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to assign seat.");
      toast.success("Seat assigned successfully!");
      setSeatLink("");
      mutate();
    } catch {
      toast.error("Error assigning seat.");
    } finally {
      setIsAssigning(false);
    }
  };

  // ✅ KEY ASSIGN HANDLER
  const handleAssignKey = async (auto = false) => {
    if (!item.availableKeys || item.availableKeys.length === 0) {
      toast.error("No available keys left.");
      return;
    }

    const keyToAssign = auto
      ? item.availableKeys[0]?.key
      : selectedKey || item.availableKeys[0]?.key;

    if (!keyToAssign) {
      toast.error("No valid key available for assignment.");
      return;
    }

    setIsAssigning(true);
    try {
      const res = await fetch(
        `/api/license-assignment/${assignmentId}/assign-key`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            licenseId: item.licenseId,
            key: keyToAssign,
            userId: currentUser?.id,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to assign key.");
      toast.success(`Key ${keyToAssign} assigned successfully!`);
      setSelectedKey("");
      mutate();
    } catch {
      toast.error("Error assigning key.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePurchase = () => {
    toast.info(`Purchase request initiated for ${item.licenseName}`);
  };

  // ✅ STATUS BADGE LOGIC
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return <CheckCircle className="h-4 w-4" />;
      case "PENDING_PURCHASE":
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING_PURCHASE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="p-6 border rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-200 space-y-5"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg text-gray-900">
            {item.licenseName}
          </h3>
          <p className="text-sm text-gray-600">
            {item.vendor} • Managed by {item.handler}
          </p>
        </div>
        <Badge
          className={cn(
            "flex items-center gap-1 text-xs capitalize",
            getStatusColor(item.status)
          )}
        >
          {getStatusIcon(item.status)}
          {item.status.toLowerCase().replace("_", " ")}
        </Badge>
      </div>

      {item.approvers?.length > 0 && (
        <div className="bg-gray-50 border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
            <User className="h-4 w-4" />
            Approver History
          </div>
          <div className="divide-y divide-gray-200">
            {item.approvers.map((a, i: number) => (
              <div
                key={`${a.email}-${i}`}
                className="flex justify-between items-center py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="font-medium text-gray-900">{a.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {a.level}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Calendar className="h-3 w-3" />
                  {formatDateTime(a.approvedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* SEAT-BASED ASSIGNMENT */}
        {item.type === "SEAT_BASED" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter seat assignment link..."
                value={seatLink}
                onChange={(e) => setSeatLink(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => handleAssignSeat(false)}
                disabled={isAssigning || !seatLink.trim()}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Assign
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleAssignSeat(true)}
                disabled={isAssigning}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Auto Assign
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Badge
                variant={item.availableSeats > 0 ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {item.availableSeats > 0 ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    {item.availableSeats} seat
                    {item.availableSeats > 1 ? "s" : ""} available
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    No seats available
                  </>
                )}
              </Badge>

              {item.availableSeats <= 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePurchase}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Purchase Seats
                </Button>
              )}
            </div>
          </div>
        )}

        {item.type === "KEY_BASED" && (
          <div className="space-y-3">
            {item.availableKeys > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <Select value={selectedKey} onValueChange={setSelectedKey}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select or auto-assign key..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* {item.availableKeys.map((k) => (
                        <SelectItem key={k.key} value={k.key}>
                          <div className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-gray-500" />
                            {k.key}
                          </div>
                        </SelectItem>
                      ))} */}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleAssignKey(false)}
                    disabled={isAssigning}
                    className="flex items-center gap-2"
                  >
                    <KeyRound className="h-4 w-4" />
                    Assign
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => handleAssignKey(true)}
                    disabled={isAssigning}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Auto Assign
                  </Button>
                </div>

                <Badge variant="outline" className="flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  {item.availableKeys} available key
                  {item.availableKeys > 1 ? "s" : ""}
                </Badge>
              </>
            ) : (
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    No keys/seats available — needs purchase
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePurchase}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Purchase Keys
                </Button>
              </div>
            )}
          </div>
        )}

        {item.type === "OTHERS" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  No keys available — needs purchase
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePurchase}
                className="flex items-center gap-2 bg-white hover:bg-gray-50"
              >
                <ShoppingCart className="h-4 w-4" />
                Purchase Keys
              </Button>
            </div>
          </div>
        )}
        {/* PENDING PURCHASE NOTICE */}
        {item.status === "PENDING_PURCHASE" && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">
              Waiting for purchase approval. Additional licenses required.
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
