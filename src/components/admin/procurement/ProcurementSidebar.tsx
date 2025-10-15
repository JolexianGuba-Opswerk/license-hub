"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function ProcurementSidebar({
  items,
  onRemoveItem,
  onSubmit,
  isLoading,
}) {
  const total = items.reduce(
    (sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Procurement Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items added yet.</p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="border p-2 rounded-md">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.vendor}</p>
              <p className="text-xs">
                ₱{item.price} × {item.quantity}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-red-500"
                onClick={() => onRemoveItem(idx)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          ))
        )}
        {items.length > 0 && (
          <div className="text-right font-semibold">
            Total: ₱{total.toFixed(2)}
          </div>
        )}
        <Button
          className="w-full"
          onClick={onSubmit}
          disabled={isLoading || items.length === 0}
        >
          {isLoading ? "Submitting..." : "Submit Procurement Request"}
        </Button>
      </CardContent>
    </Card>
  );
}
