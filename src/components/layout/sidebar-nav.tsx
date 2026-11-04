"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BarChart3,
  BookOpen,
  CalendarPlus,
  CircleUser,
  ClipboardList,
  FileText,
  IndianRupee,
  LogOut,
  Star,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/shadcn/tooltip";
import { facultyNavigation, isNavigationActive, type FacultyIcon } from "./faculty-nav";
import { initialsOf } from "./initials";

const icons: Record<FacultyIcon, typeof Users> = {
  dashboard: BarChart3,
  availability: CalendarPlus,
  bookings: Users,
  sessions: Video,
  logs: ClipboardList,
  homework: FileText,
  library: BookOpen,
  progress: Award,
  performance: TrendingUp,
  earnings: IndianRupee,
  reviews: Star,
  profile: CircleUser,
};

export type ShellAccount = { name?: string; subtitle?: string };

export function SidebarBrand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
      >
        A
      </span>
      <span className={cn("text-xl font-bold tracking-tight", collapsed && "sr-only")}>
        Amentorz
      </span>
    </Link>
  );
}

export function SidebarNav({
  collapsed = false,
  counts,
  onNavigate,
}: {
  collapsed?: boolean;
  /** Queue sizes keyed by destination href, e.g. { "/bookings": 4 } */
  counts?: Record<string, number>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Faculty navigation" className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      {facultyNavigation.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {collapsed ? (
            <div aria-hidden className="mx-2 mt-3 mb-1 border-t border-border-subtle" />
          ) : (
            <p className="px-2 pt-4 pb-1 text-xs font-semibold tracking-[0.02em] text-muted-foreground uppercase">
              {group.label}
            </p>
          )}
          {group.items.map(([title, href, icon]) => {
            const active = isNavigationActive(pathname, href);
            const Icon = icons[icon];
            const count = counts?.[href];
            const link = (
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-text-secondary outline-none transition-colors hover:bg-sunken focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  active && "bg-accent text-accent-foreground hover:bg-accent",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && (
                  <span aria-hidden className="absolute top-3 -left-px h-5 w-[3px] rounded-[2px] bg-primary" />
                )}
                <Icon aria-hidden className="size-5 shrink-0" />
                <span className={cn("flex-1 truncate", collapsed && "sr-only")}>{title}</span>
                {count !== undefined && !collapsed && (
                  <Badge variant="secondary" aria-label={`${count} waiting`}>
                    {count}
                  </Badge>
                )}
              </Link>
            );
            return collapsed ? (
              <Tooltip key={href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{title}</TooltipContent>
              </Tooltip>
            ) : (
              <div key={href}>{link}</div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function SidebarAccount({
  account,
  collapsed = false,
  onLogout,
  loggingOut,
}: {
  account: ShellAccount;
  collapsed?: boolean;
  onLogout: () => void;
  loggingOut?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3 border-t border-border-subtle p-4", collapsed && "flex-col px-2")}>
      <Link
        href="/profile"
        aria-label="My profile"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Avatar className="size-8 bg-accent">
          <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
            {initialsOf(account.name)}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <span className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm leading-5 font-semibold">{account.name ?? "My profile"}</span>
            {account.subtitle && (
              <span className="truncate text-xs leading-4 text-muted-foreground">{account.subtitle}</span>
            )}
          </span>
        )}
      </Link>
      <Button variant="ghost" size="icon-sm" aria-label="Log out" disabled={loggingOut} onClick={onLogout}>
        <LogOut aria-hidden className="size-5" />
      </Button>
    </div>
  );
}
