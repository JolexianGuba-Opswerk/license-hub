import { format } from "date-fns";
export function getActionVariant(
  action: string
): "default" | "destructive" | "outline" | "secondary" {
  const destructive = ["delete", "remove", "destroy"];
  const secondary = ["read", "view", "list"];
  if (destructive.includes(action.toLowerCase())) return "destructive";
  if (secondary.includes(action.toLowerCase())) return "secondary";
  return "default";
}

export function isInDateRange(dateString: string, range: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  switch (range) {
    case "today":
      return date.toDateString() === now.toDateString();
    case "week":
      return date >= new Date(now.getTime() - 7 * 86400000);
    case "month":
      return date >= new Date(now.getTime() - 30 * 86400000);
    default:
      return true;
  }
}

export const exportToCSV = (filteredLogs) => {
  if (!filteredLogs.length) return;

  const headers = [
    "Action",
    "Description",
    "Entity",
    "User",
    "Date",
    "IP Address",
  ];
  const csvContent = [
    headers.join(","),
    ...filteredLogs.map((log) =>
      [
        log.action,
        `"${log.description.replace(/"/g, '""')}"`,
        log.entity,
        log.user?.name || "System",
        format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        log.ipAddress || "",
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
