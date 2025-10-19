import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Package, PinIcon } from "lucide-react";
import { Label } from "recharts";

interface ItemDetailsCardProps {
  procurement;
}

export function ItemDetailsCard({ procurement }: ItemDetailsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          Item Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Item Name
            </label>
            <p className="text-gray-900 font-medium">{procurement.itemName}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Item Description
            </label>
            <p className="text-gray-900 font-medium">
              {procurement.itemDescription}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">
            <span className="flex items-center gap-2">
              <PinIcon className="h-4 w-4 text-amber-500" />
              License Request Justification *
            </span>
          </label>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
            <Textarea
              id="justification"
              value={procurement.justification}
              disabled={true}
              placeholder="Explain why this procurement is needed, including business case and benefits..."
              className="min-h-[80px] resize-vertical bg-white border-amber-300"
            />
          </div>
        </div>
        {procurement.notes && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Additional Notes
            </label>
            <p className="text-gray-900 mt-1 whitespace-pre-wrap leading-relaxed">
              {procurement.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
