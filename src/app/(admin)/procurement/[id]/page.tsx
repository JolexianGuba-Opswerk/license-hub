"use client";

import { startTransition, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { RequestDetailsSkeleton } from "@/components/admin/request/RequestDetailsSkeleton";
import { ItemDetailsCard } from "@/components/admin/procurement/procurement-details/ItemDetailsCard";
import { VendorFinancialCard } from "@/components/admin/procurement/procurement-details/VendorFinancialCard";
import { AttachmentsCard } from "@/components/admin/procurement/procurement-details/AttachmentsCard";
import { RequestInfoCard } from "@/components/admin/procurement/procurement-details/RequestInfoCard";
import { RelatedItemsCard } from "@/components/admin/procurement/procurement-details/RelatedItemCards";
import { ActionsCard } from "@/components/admin/procurement/procurement-details/ActionCard";
import { ProofOfPurchaseCard } from "@/components/admin/procurement/procurement-details/ProofOfPurchasesCard";
import { procurementDeclineApproveAction } from "@/actions/procurement/action";
import ForbiddenAccessPage from "@/components/ForbiddenAccessPage";

export default function ProcurementDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const procurementId = params.id as string;
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    procurementId ? `/api/procurement/${procurementId}` : null,
    fetcher
  );

  if (data?.error === "Forbidden" || data?.error === "Unauthorized") {
    return <ForbiddenAccessPage />;
  }
  const procurement = data?.procurement;

  const updateStatus = (newStatus: string, rejectionReason?: string) => {
    startTransition(async () => {
      setIsUpdating(true);
      try {
        const action = newStatus === "APPROVED" ? "APPROVED" : "REJECTED";

        const res = await procurementDeclineApproveAction({
          procurementId,
          action,
          remarks: rejectionReason,
        });

        if (res?.error || !res.success) {
          toast.error(res.error);
        } else {
          toast.success(res.error || `Status updated to ${newStatus}`);
          mutate(`/api/procurement/${procurementId}`);
        }
      } catch (error) {
        console.error("Update failed:", error);
        toast.error("Failed to update procurement status");
      } finally {
        setIsUpdating(false);
      }
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/procurement/upload/${fileId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete file");

      toast.success("File deleted successfully");
      mutate(); // Refresh data
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete file");
    }
  };

  if (isLoading) {
    return <RequestDetailsSkeleton />;
  }

  if (!procurement) {
    return (
      <div className="container mx-auto py-8 text-center space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">
          Procurement Not Found
        </h1>
        <p className="text-gray-600">
          The procurement request youre looking for doesnt exist.
        </p>
        <Button onClick={() => router.push("/procurement")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Procurement
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/procurement")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Procurement Request
            </h1>
            <p className="text-gray-600 text-sm">ID: {procurement.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <ItemDetailsCard procurement={procurement} />
          <VendorFinancialCard procurement={procurement} />

          {data.canUploadProof && (
            <div>
              {/* Proof of Purchase Section */}
              <ProofOfPurchaseCard
                procurement={procurement}
                onFileDelete={handleDeleteFile}
                onRefresh={mutate}
              />
            </div>
          )}
          {procurement.status === "APPROVED" &&
            procurement.purchaseStatus === "PURCHASED" &&
            !data.canUploadProof && (
              <AttachmentsCard procurement={procurement} onRefresh={mutate} />
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <RequestInfoCard procurement={procurement} />
          <RelatedItemsCard procurement={procurement} />

          {data.canTakeAction && (
            <ActionsCard
              procurement={procurement}
              isUpdating={isUpdating}
              onUpdateStatus={updateStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
}
