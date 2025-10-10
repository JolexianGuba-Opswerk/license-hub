"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoItem } from "./InfoItem";
import { User, Mail, Calendar } from "lucide-react";

export function RequestInfo({ request, targetUser }) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Request Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoItem
            icon={<User className="h-4 w-4" />}
            label="Requester"
            name={request.requestor?.name}
            email={request.requestor?.email}
            badge={request.requestor?.role}
          />
          <InfoItem
            icon={<Mail className="h-4 w-4" />}
            label="Target User"
            name={targetUser?.name}
            email={targetUser?.email}
            badge={targetUser?.role}
          />
          <InfoItem
            icon={<Calendar className="h-4 w-4" />}
            label="Requested"
            name={new Date(request.createdAt).toLocaleDateString()}
            extra={new Date(request.createdAt).toLocaleTimeString()}
          />
        </div>
      </CardContent>
    </Card>
  );
}
