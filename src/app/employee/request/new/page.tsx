"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewRequestPage() {
  const [requestType, setRequestType] = useState<"LICENSE" | "EMAIL" | "OTHER">(
    "LICENSE"
  );
  const [justification, setJustification] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // API call to create request
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">New Software Request</h1>

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Request Type</Label>
                <Select
                  value={requestType}
                  onValueChange={(value: any) => setRequestType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LICENSE">Software License</SelectItem>
                    <SelectItem value="EMAIL">Email Account</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {requestType === "LICENSE" && (
                <div>
                  <Label htmlFor="license">Select Software</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose software..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="microsoft-office">
                        Microsoft Office
                      </SelectItem>
                      <SelectItem value="adobe-premier">
                        Adobe Premier Pro
                      </SelectItem>
                      <SelectItem value="figma">Figma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="justification">Business Justification *</Label>
                <Textarea
                  id="justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Please explain why you need this software and how it will help your work..."
                  required
                  className="min-h-[120px]"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">
                  Submit Request
                </Button>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
