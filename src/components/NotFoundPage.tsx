"use client";

import { useRouter } from "next/navigation";
import { FileSearch, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotFoundPageProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

export default function NotFoundPage({
  title = "Page Not Found",
  message = "The page you are looking for does not exist. It may have been removed or the URL is incorrect.",
  showBackButton = true,
}: NotFoundPageProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="p-6 bg-gray-50 rounded-full border border-gray-200">
        <FileSearch className="h-16 w-16 text-gray-400" />
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
