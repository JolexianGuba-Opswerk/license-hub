"use client";

import ProcurementTable from "@/components/admin/procurement/ProcurementTable";

export default function ProcurementPage() {
  return (
    <div className="container mx-auto py-6 space-y-6 p-10">
      {/* Tabs + Table */}
      <ProcurementTable />
    </div>
  );
}
