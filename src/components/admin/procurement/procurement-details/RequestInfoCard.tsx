import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Building,
} from "lucide-react";
import { format } from "date-fns";
import { PurchaseStatusBadge, StatusBadge } from "./StatusBadgeComponents";
import { formatDateTime } from "@/lib/utils/formatDateTime";

interface RequestInfoCardProps {
  procurement;
}
export function RequestInfoCard({ procurement }: RequestInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-lg">Request Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badges - Side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">Approval</p>
            <StatusBadge status={procurement.status} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">Purchase</p>
            <PurchaseStatusBadge status={procurement.purchaseStatus} />
          </div>
        </div>

        <Separator />

        {/* Two-column layout for user info */}
        <div className="grid grid-cols-2 gap-3">
          {/* Requested By */}
          <div className="flex items-start gap-2">
            <User className="h-3 w-3 text-gray-400 mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500">Requested By</p>
              <p className="text-sm text-gray-900 font-medium truncate">
                {procurement.requestedBy.firstName}{" "}
                {procurement.requestedBy.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {procurement.requestedBy.email}
              </p>
            </div>
          </div>

          {/* Department */}
          <div className="flex items-start gap-2">
            <Building className="h-3 w-3 text-gray-400 mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500">Department</p>
              <Badge variant="outline" className="text-xs mt-0.5">
                {procurement.cc}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Dates in compact grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <p className="text-xs font-medium text-gray-500">Requested At</p>
            </div>
            <p className="text-sm text-gray-500">
              {formatDateTime(procurement.createdAt)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <p className="text-xs font-medium text-gray-500">Updated At</p>
            </div>
            <p className="text-sm text-gray-500">
              {formatDateTime(procurement.updatedAt)}
            </p>
          </div>
        </div>

        {/* Expected Delivery - Full width when present */}
        {procurement.expectedDelivery && (
          <>
            <Separator />
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500">Updated At</p>
                <p className="text-sm text-gray-900">
                  {format(
                    new Date(procurement.expectedDelivery),
                    "MMM dd, yyyy"
                  )}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Approval Information */}
        {procurement.approvedBy && (
          <>
            <Separator />
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500">Approved By</p>
                <p className="text-sm text-gray-900 font-medium truncate">
                  {procurement.approvedBy.firstName}{" "}
                  {procurement.approvedBy.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {procurement.approvedBy.email}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Rejection Reason - Full width when present */}
        {procurement.rejectionReason && (
          <>
            <Separator />
            <div className="flex items-start gap-2">
              <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500">
                  Rejection Reason
                </p>
                <p className="text-xs text-red-600 whitespace-pre-wrap leading-relaxed">
                  {procurement.rejectionReason}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
