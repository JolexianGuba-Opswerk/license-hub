"use client";

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { canAccessSidebarItem } from "@/lib/permissions/admin/sidebar-permission";
import { createClient } from "@/lib/supabase/supabase-client";
import { useEffect, useState } from "react";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState();
  const [userDepartment, setUserDepartment] = useState();

  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserDepartment(user?.user_metadata.department);
      setUserRole(user?.user_metadata.role);
    };
    getCurrentUser();
  });

  const filteredItems = items.filter((item) =>
    canAccessSidebarItem(item.title, userRole, userDepartment)
  );
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              onClick={() => {
                router.push("/requests/new");
              }}
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {filteredItems?.map((item) => {
            // Remove query parameters for comparison
            const itemPath = item.url.split("?")[0];
            const currentPath = pathname.split("?")[0];

            const isActive =
              currentPath === itemPath ||
              (itemPath !== "/" && currentPath.startsWith(itemPath));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={
                    isActive
                      ? "bg-primary text-primary-foreground  hover:bg-black hover:text-white focus:bg-black focus:text-white"
                      : ""
                  }
                >
                  <Link href={item.url} prefetch>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
