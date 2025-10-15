"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/formatDateTime";
import {
  autoAssignLicenseKey,
  manualAssignLicenseKey,
} from "@/actions/license-assignment/action";

import {
  CheckCircle,
  Clock,
  KeyRound,
  Package,
  User,
  Calendar,
  AlertCircle,
  Settings,
  Sparkle,
} from "lucide-react";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export function AssignmentItemCard({ item, mutate }) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [seatLink, setSeatLink] = useState("");
  const router = useRouter();
  const isAlreadyAssigned =
    item.status === "ASSIGNING" || item.status === "ASSIGNED";

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return <CheckCircle className="h-4 w-4" />;
      case "PENDING_PURCHASE":
        return <Clock className="h-4 w-4" />;
      case "ASSIGNING":
        return <Clock className="h-4 w-4 animate-pulse text-blue-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-green-100 text-green-800 border-green-200";
      case "ASSIGNING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING_PURCHASE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleAssignSeat = async (auto = false) => {
    if (item.totalAvailableSeats <= 0)
      return toast.error("No available seats left.");
    if (isAlreadyAssigned) return toast.info("User is already assigned.");

    if (!auto && !seatLink.trim()) {
      toast.error("Please provide a seat link.");
      return;
    }

    setIsAssigning(true);
    try {
      const res = await manualAssignLicenseKey({
        requestItemId: item.id,
        seatLink: seatLink || undefined,
        type: "SEAT_BASED",
      });

      if (!res.success) {
        toast.error(res.error || "Failed to assign seat.");
        return;
      }

      toast.success(auto ? "Seat auto-assigned!" : "Seat assigned!");
      setSeatLink("");
      setSelectedKey("");
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Error assigning seat.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignKey = async (auto = false) => {
    if (item.availableKeys <= 0) return toast.error("No available keys left.");
    if (isAlreadyAssigned) return toast.info("User is already assigned.");
    if (!auto && !selectedKey) return toast.error("Please select a key.");

    setIsAssigning(true);
    try {
      const res = auto
        ? await autoAssignLicenseKey({ requestItemId: item.id })
        : await manualAssignLicenseKey({
            requestItemId: item.id,
            licenseKeyId: selectedKey,
            type: "KEY_BASED",
          });

      if (!res?.success) {
        toast.error(res.error || "Failed to assign key.");
        return;
      }

      toast.success(auto ? "Key auto-assigned!" : "Key assigned!");
      setSelectedKey("");
      mutate();
    } catch {
      toast.error("Error assigning key.");
    } finally {
      setIsAssigning(false);
    }
  };

  const ApproversSection = () =>
    item.approvers?.length > 0 && (
      <div className="bg-gray-50 border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
          <User className="h-4 w-4" />
          Approver History
        </div>
        <div className="divide-y divide-gray-200">
          {item.approvers.map((a, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:justify-between py-2 text-sm gap-1 sm:gap-0"
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
    );

  // SEAT BASED ASSIGNMENT
  const renderSeatBased = () => {
    if (item.status === "DENIED") {
      return (
        <Alert className="border-red-300 bg-red-50 text-red-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <AlertTitle>Request Denied</AlertTitle>
          </div>
          <AlertDescription>
            This request item has been denied and cannot be assigned. Please
            review the denial reason or contact the requestor for more
            information.
          </AlertDescription>
        </Alert>
      );
    }
    if (!item.canAction)
      return (
        <Alert className="border-yellow-300 bg-yellow-50 text-yellow-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <AlertTitle>Action Restricted</AlertTitle>
          </div>
          <AlertDescription>
            You do not have permission to assign or configure this license.
          </AlertDescription>
        </Alert>
      );

    if (item.needsConfiguration && !isAlreadyAssigned)
      return (
        <Alert className="border-yellow-300 bg-yellow-50 text-yellow-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
          </div>
          <AlertDescription>
            This license needs configuration before assigning.
          </AlertDescription>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push(`/license-management/${item.licenseId}`)}
            className="self-start mt-1"
          >
            Configure Seat
          </Button>
        </Alert>
      );

    if (isAlreadyAssigned)
      return (
        <Alert className="border-blue-200 bg-blue-50 text-blue-700">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Already Assigned</AlertTitle>
        </Alert>
      );

    return (
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Input
            placeholder="Enter seat assignment link..."
            value={seatLink}
            onChange={(e) => setSeatLink(e.target.value)}
            className="flex-1"
            disabled={isAssigning}
          />
          <Button
            className="w-full sm:w-auto"
            onClick={() => handleAssignSeat(false)}
            disabled={isAssigning || !seatLink.trim()}
          >
            Assign
          </Button>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {item.totalAvailableSeats} seat{item.totalAvailableSeats > 1 && "s"}{" "}
          available
        </Badge>
      </div>
    );
  };

  // KEY BASED ASSIGNMENT
  const renderKeyBased = () => {
    if (item.status === "DENIED")
      return (
        <Alert className="border-red-300 bg-red-50 text-red-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <AlertTitle>Request Denied</AlertTitle>
          </div>
          <AlertDescription>
            This request item has been denied and cannot be assigned. Please
            review the denial reason or contact the requestor for more
            information.
          </AlertDescription>
        </Alert>
      );

    if (item.status === "FULFILLED" || isAlreadyAssigned)
      return (
        <Alert className="border-blue-200 bg-blue-50 text-blue-700">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Already Assigned</AlertTitle>
        </Alert>
      );

    if (!item.canAction)
      return (
        <Alert className="border-yellow-300 bg-yellow-50 text-yellow-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <AlertTitle>Action Restricted</AlertTitle>
          </div>
        </Alert>
      );

    if (item.needsConfiguration && !isAlreadyAssigned)
      return (
        <Alert className="border-yellow-300 bg-yellow-50 text-yellow-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
          </div>
          <AlertDescription>
            This license needs configuration before assigning.
          </AlertDescription>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push(`/license-management/${item.licenseId}`)}
            className="self-start mt-1"
          >
            Configure Seat
          </Button>
        </Alert>
      );

    return (
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Select value={selectedKey} onValueChange={setSelectedKey}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select or auto-assign key..." />
            </SelectTrigger>
            <SelectContent>
              {item.availableKeysList?.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-gray-500" />
                    {k.key}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* <Button
            className="w-full sm:w-auto"
            onClick={() => handleAssignKey(false)}
            disabled={isAssigning || !selectedKey}
          >
            Assign
          </Button> */}
          <Button
            variant="secondary"
            className="w-full sm:w-auto flex items-center gap-2 justify-center"
            onClick={() => handleAssignKey(true)}
            disabled={isAssigning}
          >
            <Sparkle className="w-4 h-4 text-gray-500" /> Auto Assign
          </Button>
        </div>

        <Badge variant="outline" className="flex items-center gap-1">
          <KeyRound className="h-3 w-3" />
          {item.availableCount} key{item.availableCount > 1 && "s"} available
        </Badge>
      </div>
    );
  };

  const renderOthers = () => {
    if (item.status === "DENIED") {
      return (
        <Alert className="border-red-300 bg-red-50 text-red-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <AlertTitle>Request Denied</AlertTitle>
          </div>
          <AlertDescription>
            This request item has been denied and cannot be assigned. Please
            review the denial reason or contact the requestor for more
            information.
          </AlertDescription>
        </Alert>
      );
    }
    return (
      <Alert className="border-yellow-300 bg-yellow-50 text-yellow-800">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Pending Purchase</AlertTitle>
      </Alert>
    );
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="p-4 sm:p-6 border rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-200 space-y-5 w-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
        <div>
          <h3 className="font-semibold text-lg sm:text-xl text-gray-900 truncate">
            {item.licenseName}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {item.vendor} • Managed by{" "}
            {item.handler === "UNKNOWN" ? "ITSG" : item.handler}
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

      <ApproversSection />

      {item.type === "SEAT_BASED" && renderSeatBased()}
      {item.type === "KEY_BASED" && renderKeyBased()}
      {item.type === "OTHERS" && renderOthers()}
    </motion.div>
  );
}
