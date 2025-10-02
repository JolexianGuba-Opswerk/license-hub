"use client";

import { Button } from "@/components/ui/button";

import { toast } from "sonner";

export function AuthButtons() {
  async function signInWithMicrosoft() {
    toast.info("This feature will be available soon");
  }

  async function availableSoon() {
    toast.info("This feature will be available soon");
  }

  return (
    <Button onClick={availableSoon} variant="outline" className="w-full">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 23 23"
        width="18"
        height="18"
      >
        <rect width="10" height="10" x="1" y="1" fill="#F25022" />
        <rect width="10" height="10" x="12" y="1" fill="#7FBA00" />
        <rect width="10" height="10" x="1" y="12" fill="#00A4EF" />
        <rect width="10" height="10" x="12" y="12" fill="#FFB900" />
      </svg>
      Sign in with Microsoft
    </Button>
  );
}
