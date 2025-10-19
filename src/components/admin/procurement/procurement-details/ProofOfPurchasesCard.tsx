"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { mutate } from "swr";
import { uploadProofOfPurchase } from "@/actions/procurement/action";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Trash2, Download, Check } from "lucide-react";

interface ProofOfPurchaseCardProps {
  procurement: any;
  onRefresh: () => void;
  onFileDelete: (fileId: string) => Promise<void>;
}

export function ProofOfPurchaseCard({
  procurement,
  onRefresh,
  onFileDelete,
}: ProofOfPurchaseCardProps) {
  const [isUploading, setIsUploading] = useState(false);

  const proofFiles = procurement.attachments;

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files?.length) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    setIsUploading(true);
    let uploadedCount = 0;

    try {
      for (const file of Array.from(files)) {
        if (!allowedTypes.includes(file.type)) {
          toast.error(
            `${file.name} is not valid. Allowed: JPG, PNG, PDF, DOC, DOCX`
          );
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 5MB limit`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "PROOF_OF_PURCHASE");

        const res = await uploadProofOfPurchase(formData, procurement.id);

        if (!res.success || res.error) {
          toast.error(res.error || "Error saving file");
          continue;
        }

        uploadedCount++;
      }

      if (uploadedCount > 0) {
        toast.success(`${uploadedCount} file(s) uploaded successfully`);
        onRefresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while uploading");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg w-full">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Proof of Purchase</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={proofFiles?.length ? "default" : "secondary"}>
              {proofFiles?.length || 0} files
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Upload Section */}
        {proofFiles?.length < 3 && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              disabled={isUploading}
              onClick={() => document.getElementById("proof-upload")?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload Proof(s)"}
            </Button>
            <input
              id="proof-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="text-sm text-gray-500">
              Supports multiple JPG, PNG, PDF, DOC (Max 5MB each)
            </span>
          </div>
        )}

        {/* Files List */}
        {proofFiles?.length ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">
              Uploaded Files:
            </h4>
            {proofFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded{" "}
                      {format(
                        new Date(file.uploadedAt),
                        "MMM dd, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild className="h-8">
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast.info("This feature will be available soon")
                    }
                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No proof of purchase files uploaded yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
