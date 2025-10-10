"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function InfoItem({
  icon,
  label,
  name,
  email,
  badge,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  name?: string;
  email?: string;
  badge?: string;
  extra?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 text-muted-foreground">{icon}</div>
      <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="font-medium text-base">{name || "New License Reuqest"}</p>
        {email && <p className="text-sm text-muted-foreground">{email}</p>}
        {badge && (
          <Badge variant="outline" className="mt-1 text-xs">
            {badge}
          </Badge>
        )}
        {extra && <p className="text-xs text-muted-foreground">{extra}</p>}
      </div>
    </div>
  );
}
