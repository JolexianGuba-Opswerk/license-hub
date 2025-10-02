import { UserTable } from "@/components/data-table";

export default function UserManagement() {
  return (
    <div className="flex flex-1 flex-col pt-5">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <UserTable />
      </div>
    </div>
  );
}
