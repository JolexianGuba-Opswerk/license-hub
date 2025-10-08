"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase-client";
import {
  Bell,
  FileCheck,
  UserPlus,
  ClipboardList,
  CalendarClock,
  FileKey,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Notification } from "@/lib/schemas/notification/notification";
import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateNotificationAction } from "@/actions/notification/action";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  LICENSE_CREATED: {
    icon: FileKey,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  LICENSE_ASSIGNED: {
    icon: FileCheck,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  LICENSE_EXPIRED: {
    icon: CalendarClock,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  LICENSE_REQUESTED: {
    icon: ClipboardList,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  PROCUREMENT_REQUEST: {
    icon: ClipboardList,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  USER_ADDED: {
    icon: UserPlus,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  GENERAL: {
    icon: Info,
    color: "text-gray-600",
    bg: "bg-gray-50",
  },
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function NotificationBell() {
  const supabase = createClient();
  const router = useRouter();
  const { data, error, mutate } = useSWR("/api/notification", fetcher, {
    revalidateOnFocus: true,
  });

  const notifications: Notification[] = data?.notifications ?? [];
  //   const notifications: Notification[] = mockNotifications;
  const userId = data?.userId ?? "";

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${userId}`,
        },
        async (payload) => {
          mutate(
            (current: any) => ({
              ...current,
              notifications: [payload.new, ...(current?.notifications ?? [])],
            }),
            { revalidate: false }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, mutate]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-h-96 overflow-y-auto"
        side="right"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-2">
          {error && (
            <p className="text-sm text-red-500">Failed to load notifications</p>
          )}
          {!data ? (
            <p className="text-sm text-gray-500 text-center py-2">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">
              No notifications
            </p>
          ) : (
            notifications.map((n) => {
              const config = typeConfig[n.type] || typeConfig.GENERAL;
              const Icon = config.icon;

              return (
                <div
                  onClick={() => {
                    startTransition(() => {
                      updateNotificationAction(n.id).then(() => mutate());
                    });
                    router.push(n.url!);
                  }}
                  key={n.id}
                  className={`cursor-pointer flex items-start gap-3 p-3 rounded-lg ${
                    n.read ? "bg-white" : config.bg
                  }`}
                >
                  <Icon className={`h-5 w-5 ${config.color} mt-0.5`} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{n.title}</p>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
