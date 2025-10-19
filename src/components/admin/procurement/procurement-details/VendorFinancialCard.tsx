import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building, Mail } from "lucide-react";

interface VendorFinancialCardProps {
  procurement;
}

export function VendorFinancialCard({ procurement }: VendorFinancialCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building className="h-5 w-5" />
          Vendor & Financial Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Vendor Name
            </label>
            <p className="text-gray-900 font-medium">{procurement.vendor}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Vendor Email
            </label>
            <p className="text-gray-900 font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {procurement.vendorEmail || "Not provided"}
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Price per Unit
            </label>
            <p className="text-gray-900 font-medium">
              {procurement.price
                ? `${procurement.currency} ${procurement.price.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}`
                : "Not specified"}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Quantity
            </label>
            <p className="text-gray-900 font-medium">{procurement.quantity}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Total Cost
            </label>
            <p className="text-gray-900 font-medium">
              {procurement.totalCost
                ? `${
                    procurement.currency
                  } ${procurement.totalCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "Not calculated"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
