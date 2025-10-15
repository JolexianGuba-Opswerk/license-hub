"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Package } from "lucide-react";

export default function ProcurementItemCard({ item, onRemove }) {
  return (
    <div className="p-3 border rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3">
        <Package className="h-4 w-4 text-blue-500 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {item.vendor || "Vendor"}
            </Badge>
            <span className="text-xs text-muted-foreground">{item.name}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {item.justification}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 flex-shrink-0"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
