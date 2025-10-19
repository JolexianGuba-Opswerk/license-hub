"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { acceptProofOfPurchase } from "@/actions/procurement/action";
import { toast } from "sonner";

interface AttachmentsCardProps {
  procurement;
  onRefresh: () => void;
}

export function AttachmentsCard({
  procurement,
  onRefresh,
}: AttachmentsCardProps) {
  const [loading, setLoading] = useState(false);

  const handleAcceptance = async () => {
    try {
      setLoading(true);

      const response = await acceptProofOfPurchase(procurement.id);
      if (response?.error) {
        toast.error(response.error || "Something went wrong.");
        return;
      }

      toast.success(
        "Proof of purchase verified and procurement request finalized successfully."
      );
      onRefresh();
    } catch {
      toast.error("Something went wrong while finalizing the request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          {/* Left side: icon + title */}
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-semibold text-gray-800">
              Attachments ({procurement.attachments?.length || 0})
            </span>
          </div>

          {/* Right side: action button */}
          {procurement.purchaseStatus === "PURCHASED" && (
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
              onClick={handleAcceptance}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Approve & Complete
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {procurement.attachments?.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Uploaded{" "}
                    {format(
                      new Date(attachment.uploadedAt),
                      "MMM dd, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex-shrink-0"
              >
                <a
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
