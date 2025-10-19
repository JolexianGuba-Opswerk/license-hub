import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface RelatedItemsCardProps {
  procurement;
}

export function RelatedItemsCard({ procurement }: RelatedItemsCardProps) {
  const router = useRouter();
  if (!procurement.requestItem) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-lg">Related Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {procurement.requestItem.license && (
          <div className="p-4 border rounded-lg space-y-2">
            <p className="text-sm font-medium text-gray-900">Linked License</p>
            <p className="text-sm text-gray-600">
              {procurement.requestItem.license.name}
            </p>
            {procurement.requestItem.license.description && (
              <p className="text-xs text-gray-500">
                {procurement.requestItem.license.description}
              </p>
            )}
          </div>
        )}

        <div
          className="p-4 border rounded-lg space-y-2 cursor-pointer"
          onClick={() =>
            router.push(`/requests/${procurement.requestItem?.request?.id}`)
          }
        >
          <p className="text-sm font-medium text-gray-900">Linked Request</p>
          <p className="text-sm text-gray-600">
            {procurement.requestItem.title}
          </p>
          <p className="text-xs text-gray-500">
            ID: {procurement.requestItem.request.id}
          </p>
          {procurement.requestItem.description && (
            <p className="text-xs text-gray-500 mt-1">
              {procurement.requestItem.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
