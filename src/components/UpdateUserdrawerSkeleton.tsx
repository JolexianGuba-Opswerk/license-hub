import { Skeleton } from "@/components/ui/skeleton";

export function UpdateUserDrawerSkeleton() {
  return (
    <div>
      <div className="flex flex-col gap-4 px-4 py-2 overflow-y-auto">
        {/* Name */}
        <FieldSkeleton />

        {/* Email */}
        <FieldSkeleton />

        {/* Department & Role */}
        <div className="grid grid-cols-2 gap-4 mt-3">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>

        {/* Position */}
        <FieldSkeleton />

        {/* Manager & Added By */}
        <div className="grid grid-cols-2 gap-4 mt-3">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>

        {/* Joined & Updated */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FieldSkeleton short />
          <FieldSkeleton short />
        </div>
      </div>
    </div>
  );
}

function FieldSkeleton({ short }: { short?: boolean }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" /> {/* Label */}
      <Skeleton className={`h-10 ${short ? "w-32" : "w-full"}`} /> {/* Input */}
    </div>
  );
}
