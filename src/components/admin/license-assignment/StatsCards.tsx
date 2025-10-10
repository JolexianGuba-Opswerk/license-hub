"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function StatsCards({ assignments }) {
  const stats = [
    {
      label: "Ready to Assign",
      value: assignments[0]?.analytics.readyToAssignCount || 0,
      color: "text-green-600",
    },
    {
      label: "Partially Done",
      value: assignments?.filter((a) => a.status === "PARTIALLY_ASSIGNED")
        .length,
      color: "text-yellow-600",
    },
    {
      label: "Waiting for Owners",
      value: assignments[0]?.analytics.waitingForApprovals || 0,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <Card key={idx}>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
