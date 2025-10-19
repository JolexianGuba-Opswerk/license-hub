"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ForbiddenAccessPageProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

export default function ForbiddenAccessPage({
  title = "Access Restricted",
  message = "You don’t have the required permissions to access this page. If you believe this is a mistake, please contact your administrator.",
  showBackButton = true,
}: ForbiddenAccessPageProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="p-6 bg-red-50 rounded-full border border-red-100">
        <ShieldAlert className="h-16 w-16 text-red-500" />
      </div>

      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>

      <p className="text-muted-foreground max-w-md">{message}</p>

      {showBackButton && (
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      )}
    </div>
  );
}
