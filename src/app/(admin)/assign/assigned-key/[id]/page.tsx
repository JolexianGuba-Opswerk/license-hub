"use client";

import useSWR from "swr";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Check,
  KeyRound,
  MonitorCheck,
  Lock,
  Clock,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Calendar,
  Building,
} from "lucide-react";

import { fetcher } from "@/lib/fetcher";
import { licenseAccessVerification } from "@/actions/license-assignment/license-access/action";
import { formatDateTime } from "@/lib/utils/formatDateTime";
import { licenseReceivalConfirmation } from "@/actions/license-assignment/action";

export default function AssignedKeysByRequestPage() {
  const { id } = useParams();

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "view" | "copy";
    key: string;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [keyStates, setKeyStates] = useState<
    Record<string, { visible: boolean; copied: boolean }>
  >({});

  const {
    data: assignedData,
    isLoading,
    mutate,
  } = useSWR(id ? `/api/license-assignment/assigned/${id}` : null, fetcher);

  const assignedKeys = assignedData?.assignments ?? [];

  // Unauthorized handler
  if (assignedData?.error === "Unauthorized")
    return (
      <Card className="max-w-md mx-auto text-center p-6 border-red-200 shadow-md mt-16">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
          <Lock className="w-7 h-7 text-red-600" />
        </div>
        <CardTitle className="text-lg font-semibold text-red-700 mb-2">
          Access Restricted
        </CardTitle>
        <p className="text-sm text-muted-foreground mb-3">
          You dont have permission to view this request.
        </p>
      </Card>
    );

  // Loading skeleton
  if (isLoading)
    return (
      <div className="min-h-screen bg-slate-50 p-10 animate-pulse">
        <div className="max-w-5xl mx-auto grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <Skeleton className="h-9 w-full rounded-md" />
            </Card>
          ))}
        </div>
      </div>
    );

  // Empty state
  if (!assignedKeys.length)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center p-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
            <MonitorCheck className="w-7 h-7 text-blue-600" />
          </div>
          <CardTitle className="text-lg font-semibold mb-2">
            No License Assignments
          </CardTitle>
          <p className="text-sm text-muted-foreground">No licenses found.</p>
        </Card>
      </div>
    );

  const pendingKeys = assignedKeys.filter((key) => key.status === "ASSIGNING");
  const confirmedKeys = assignedKeys.filter(
    (key) => key.status === "FULFILLED"
  );

  const handleConfirm = async (licenseAssignmentId: string) => {
    try {
      setConfirmingId(licenseAssignmentId);
      const response = await licenseReceivalConfirmation(licenseAssignmentId);
      if (!response.success) throw new Error(response.error || "Unknown error");
      toast.success("License confirmed successfully!");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm license.");
    } finally {
      setConfirmingId(null);
    }
  };

  const requestPassword = (type: "view" | "copy", key: string) => {
    setPendingAction({ type, key });
    setModalOpen(true);
  };

  const verifyPassword = async () => {
    if (!password.trim()) return toast.error("Please enter your password.");
    try {
      setVerifying(true);
      const response = await licenseAccessVerification(password);
      if (!response.success)
        throw new Error(response.message || "Invalid password");

      setModalOpen(false);
      setPassword("");

      if (!pendingAction) return;
      const key = pendingAction.key;

      setKeyStates((prev) => ({
        ...prev,
        [key]: {
          visible: pendingAction.type === "view",
          copied: pendingAction.type === "copy",
        },
      }));

      if (pendingAction.type === "copy") {
        navigator.clipboard.writeText(key);
        toast.success("License key copied!");
        setTimeout(() => {
          setKeyStates((prev) => ({
            ...prev,
            [key]: { ...prev[key], copied: false },
          }));
        }, 2000);
      }
    } catch (err: any) {
      toast.error(err.message || "Verification failed. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const toggleKeyVisibility = (keyValue: string) => {
    setKeyStates((prev) => ({
      ...prev,
      [keyValue]: { ...prev[keyValue], visible: !prev[keyValue]?.visible },
    }));
  };

  const renderCard = (key: any, isPending: boolean) => {
    const keyState = keyStates[key.keyValue] || {
      visible: false,
      copied: false,
    };
    const color = isPending ? "amber" : "green";

    return (
      <Card
        key={key.id}
        className={`p-5 border-${color}-200 hover:shadow-md transition-shadow`}
      >
        <CardHeader className="p-0 mb-4">
          <div className="flex items-start justify-between mb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className={`w-4 h-4 text-${color}-600`} />
              <span className="line-clamp-1">{key.licenseName}</span>
              <Badge variant="secondary" className="text-xs">
                {key.type}
              </Badge>
            </CardTitle>
            <Badge
              variant="outline"
              className={`bg-${color}-50 text-${color}-700 border-${color}-300 text-xs`}
            >
              {key.vendor}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Building className="w-3 h-3" />
              <span>Vendor: {key.vendor}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>Assigned: {formatDateTime(key.assignedAt)}</span>
            </div>

            {key.assigner && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-3 h-3" />
                <span>By: {key.assigner.name}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 space-y-3 text-sm">
          {keyState.visible ? (
            <div className="space-y-2">
              <code className="block text-xs font-mono bg-gray-100 p-2 rounded border break-all">
                {key.keyValue}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleKeyVisibility(key.keyValue)}
                className="w-full"
              >
                <EyeOff className="w-3 h-3 mr-1" /> Hide Key
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => requestPassword("view", key.keyValue)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" /> View
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => requestPassword("copy", key.keyValue)}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
            </div>
          )}
          {keyState.copied && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Copied to clipboard!
            </p>
          )}
        </CardContent>
        <CardFooter className="p-0 mt-4">
          {isPending ? (
            <Button
              className={`w-full bg-amber-600 hover:bg-${color}-700 h-9 text-sm`}
              onClick={() => handleConfirm(key.id)}
              disabled={confirmingId === key.id}
            >
              {confirmingId === key.id ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm Assignment"
              )}
            </Button>
          ) : (
            <div className="w-full text-center">
              <Badge
                className={`bg-${color}-100 text-${color}-700 border-${color}-300`}
              >
                <Check className="w-3 h-3 mr-1" />
                Confirmed
              </Badge>
            </div>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900 flex items-baseline gap-2">
            License Request
            <span className="text-lg text-gray-600 font-mono">#{id}</span>
          </h1>
          <ShieldCheck className="w-5 h-5 text-gray-400" />
        </div>

        {/* Pending Section */}
        {pendingKeys.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Pending Confirmation ({pendingKeys.length})
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {pendingKeys.map((key) => renderCard(key, true))}
            </div>
          </section>
        )}

        {/* Confirmed Section */}
        {confirmedKeys.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Confirmed Licenses ({confirmedKeys.length})
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {confirmedKeys.map((key) => renderCard(key, false))}
            </div>
          </section>
        )}
      </div>

      {/* Password Verification Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Verify Your Identity
            </DialogTitle>
            <p className="text-sm text-gray-600">
              Enter your account password to{" "}
              {pendingAction?.type === "copy" ? "copy" : "view"} this license
              key.
            </p>
          </DialogHeader>

          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
          />

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={verifyPassword} disabled={verifying}>
              {verifying ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
