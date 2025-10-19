import { Badge } from "@/components/ui/badge";

export const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    PENDING: { variant: "secondary" as const, label: "Pending" },
    APPROVED: { variant: "default" as const, label: "Approved" },
    REJECTED: { variant: "destructive" as const, label: "Rejected" },
    COMPLETED: { variant: "outline" as const, label: "Completed" },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const PurchaseStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    NOT_STARTED: { variant: "secondary" as const, label: "Not Started" },
    IN_PROGRESS: { variant: "default" as const, label: "In Progress" },
    PURCHASED: { variant: "default" as const, label: "Purchased" },
    COMPLETED: { variant: "outline" as const, label: "Completed" },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] ||
    statusConfig.NOT_STARTED;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};
