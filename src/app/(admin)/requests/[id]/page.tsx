"use client";

import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/supabase-client";
import { fetcher } from "@/lib/fetcher";
import { RequestDetailsSkeleton } from "@/components/admin/request/RequestDetailsSkeleton";
import { RequestHeader } from "@/components/admin/request/RequestHeader";
import { RequestInfo } from "@/components/admin/request/RequestInfo";
import { RequestItemCard } from "@/components/admin/request/RequestItemCard";

export default function RequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<any>(null);

  const {
    data: request,
    mutate,
    isLoading,
  } = useSWR(`/api/request/${id}`, fetcher);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) router.push("/login");
      setCurrentUser(user);
    };
    fetchUser();
  }, [supabase, router]);

  if (isLoading) return <RequestDetailsSkeleton />;

  if (!request) return <p className="p-6 text-center">Request Not Found</p>;

  const targetUser = request.requestedFor || request.requestor;

  return (
    <div className="container mx-auto w-full p-10 space-y-6">
      <RequestHeader request={request} router={router} />
      <RequestInfo request={request} targetUser={targetUser} />

      {/* Grid layout for items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {request.items.map((item) => (
          <RequestItemCard
            key={item.id}
            item={item}
            request={request}
            currentUser={currentUser}
            mutate={mutate}
          />
        ))}
      </div>
    </div>
  );
}
