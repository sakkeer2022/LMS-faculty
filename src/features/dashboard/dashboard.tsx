"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, MoreVertical, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { initialsOf } from "@/components/layout/initials";
import { PageHeader } from "@/components/layout/page-header";
import { PanelMessage } from "@/components/layout/panel-message";
import { formatPaise } from "@/features/portal/model";
import { useDashboard, type DashboardData, type DemoState, type SessionStatus } from "./adapter";

type Overview = DashboardData["overview"];

const percent = (value: number, of: number) => (of > 0 ? Math.min(100, (value / of) * 100) : 0);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const statusVariant: Record<SessionStatus, "success" | "default" | "info" | "destructive"> = {
  Completed: "success",
  "In progress": "default",
  Confirmed: "info",
  Cancelled: "destructive",
};

function StatusPill({ status }: { status: SessionStatus }) {
  return (
    <Badge variant={statusVariant[status]}>
      <span aria-hidden className="size-1.5 rounded-pill bg-current" />
      {status}
    </Badge>
  );
}

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 px-6 pb-5" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

/** Red banner shown while overdue daily logs block the next day's sessions. */
function LogsBlockedBanner({ logs }: { logs: Overview["overdueLogs"] }) {
  if (!logs.count) return null;
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-4 rounded-md border border-error-foreground/15 bg-error-subtle px-5 py-4"
    >
      <AlertTriangle aria-hidden className="size-5 shrink-0 self-start text-error-foreground sm:self-center" />
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
        <p className="text-base font-semibold text-error-foreground">
          {plural(logs.count, "daily log")} {logs.count === 1 ? "is" : "are"} overdue — tomorrow&apos;s sessions are
          blocked
        </p>
        <p className="text-xs text-error-foreground/80">
          Sessions on {logs.blockedDate} will not open until the logs for {logs.logDate} are filed. Filing them
          restores access immediately.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/sessions">View sessions</Link>
        </Button>
        <Button variant="destructive" asChild>
          <Link href="/daily-logs">File logs now</Link>
        </Button>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  progress,
  barClassName,
  detail,
}: {
  label: string;
  value: ReactNode;
  progress: number;
  barClassName: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-5">
      <p className="text-xs font-semibold tracking-[0.02em] text-white/70 uppercase">{label}</p>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <Progress value={progress} aria-label={label} className="bg-white/15" indicatorClassName={barClassName} />
      <p className="text-xs text-white/70">{detail}</p>
    </div>
  );
}

/** Dark summary strip: billable sessions, performance score, projected incentive, rating. */
function StatsStrip({ data }: { data: Overview }) {
  const { billable, performance, rating } = data;
  const toVolume = Math.max(0, billable.threshold - billable.done);
  const margin = performance.score - performance.threshold;
  return (
    <section
      aria-label="This cycle"
      className="grid grid-cols-1 divide-y divide-white/10 rounded-md bg-foreground text-white shadow-card sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x"
    >
      <StatBlock
        label="Billable sessions"
        value={`${billable.done} / ${billable.threshold}`}
        progress={percent(billable.done, billable.threshold)}
        barClassName="bg-primary"
        detail={toVolume ? `${toVolume} more to reach the volume threshold` : "Volume threshold reached"}
      />
      <StatBlock
        label="Performance score"
        value={`${performance.score} / ${performance.max}`}
        progress={percent(performance.score, performance.max)}
        barClassName="bg-success-foreground"
        detail={
          margin >= 0
            ? `${margin} points clear of the ${performance.threshold}-point threshold`
            : `${-margin} points below the ${performance.threshold}-point threshold`
        }
      />
      <StatBlock
        label="Projected incentive"
        value={formatPaise(data.incentivePaise)}
        progress={0}
        barClassName="bg-white/40"
        detail="Pays only if both conditions clear"
      />
      <StatBlock
        label="Average rating"
        value={`${rating.average} / ${rating.max}`}
        progress={percent(rating.average, rating.max)}
        barClassName="bg-primary"
        detail={`${plural(rating.unreadThisMonth, "unread review")} this month`}
      />
    </section>
  );
}

function TodaySessions({ state }: { state: DemoState }) {
  const sessions = useDashboard("sessions", state);
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>Today&apos;s sessions</CardTitle>
        {sessions.data && (
          <CardAction>
            <Badge>{sessions.data.length} today</Badge>
          </CardAction>
        )}
      </CardHeader>
      {sessions.isPending ? (
        <PanelSkeleton />
      ) : sessions.isError ? (
        <PanelMessage onRetry={() => void sessions.refetch()}>Sessions unavailable.</PanelMessage>
      ) : !sessions.data.length ? (
        <PanelMessage>No sessions today.</PanelMessage>
      ) : (
        <CardContent className="pb-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="py-3">
                    <span className="block font-semibold">{s.student}</span>
                    <span className="block text-xs text-muted-foreground">{s.subject}</span>
                  </TableCell>
                  <TableCell>{s.scheduled}</TableCell>
                  <TableCell>
                    <StatusPill status={s.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${s.student}`}>
                          <MoreVertical aria-hidden className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href="/sessions">Open session</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/daily-logs">File daily log</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}

/** A progress bar with a tick at the threshold. */
function Meter({
  label,
  value,
  max,
  threshold,
  barClassName,
  caption,
}: {
  label: string;
  value: number;
  max: number;
  threshold: number;
  barClassName: string;
  caption: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-base font-bold">
          {value} / {max}
        </span>
      </div>
      <div className="relative">
        <Progress value={percent(value, max)} aria-label={label} indicatorClassName={barClassName} />
        <span
          aria-hidden
          className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 rounded-pill bg-foreground"
          style={{ left: `${percent(threshold, max)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{caption}</span>
    </div>
  );
}

function AtAGlance({ data }: { data: Overview }) {
  const { billable, performance } = data;
  const toVolume = Math.max(0, billable.threshold - billable.done);
  const margin = performance.score - performance.threshold;
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>{data.cycle.month} at a glance</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pb-5">
        <Meter
          label="Billable sessions"
          value={billable.done}
          max={billable.threshold}
          threshold={billable.threshold}
          barClassName="bg-primary"
          caption={`Volume threshold: ${billable.threshold} sessions`}
        />
        <Meter
          label="Performance score"
          value={performance.score}
          max={performance.max}
          threshold={performance.threshold}
          barClassName="bg-success-foreground"
          caption={`Incentive threshold: ${performance.threshold} points`}
        />
        <div className="flex flex-col gap-2 text-xs text-text-secondary">
          <p>
            {toVolume
              ? `${toVolume} more billable sessions to reach ${billable.threshold}.`
              : `Volume threshold of ${billable.threshold} reached.`}{" "}
            Sessions under {billable.minimumMinutes} minutes do not count.
          </p>
          <p>
            {margin >= 0
              ? `Score is ${margin} points clear of the ${performance.threshold}-point threshold. One late login would drop it to ${performance.score - performance.latePenalty}.`
              : `Score is ${-margin} points below the ${performance.threshold}-point threshold.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function LatestReviews({ state }: { state: DemoState }) {
  const reviews = useDashboard("reviews", state);
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>Latest reviews</CardTitle>
        {!!reviews.data?.total && (
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reviews">View all {reviews.data.total} reviews</Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      {reviews.isPending ? (
        <PanelSkeleton rows={2} />
      ) : reviews.isError ? (
        <PanelMessage onRetry={() => void reviews.refetch()}>Reviews unavailable.</PanelMessage>
      ) : !reviews.data.items.length ? (
        <PanelMessage>No reviews yet.</PanelMessage>
      ) : (
        <CardContent className="pb-2">
          <ul className="flex flex-col">
            {reviews.data.items.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 border-t border-border-subtle py-4">
                <div className="flex items-start gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                      {initialsOf(r.student)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold">{r.student}</span>
                    <span className="text-xs text-muted-foreground">{r.context}</span>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-bold" aria-label={`Rated ${r.rating} out of 10`}>
                    <Star aria-hidden className="size-4 fill-current text-warning-border" />
                    {r.rating}
                    <span className="text-xs font-normal text-muted-foreground">/ 10</span>
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{r.text}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}

/** Faculty dashboard, Figma "Screen/17 · Dashboard — logs blocked". `?demoState=loading|empty|error` previews states. */
export function Dashboard() {
  const search = useSearchParams();
  const requested = search.get("demoState") ?? "";
  const state: DemoState = requested === "loading" || requested === "empty" || requested === "error" ? requested : "ready";
  const overview = useDashboard("overview", state);
  const data = overview.data;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          data
            ? `${data.today} · ${data.cycle.month} cycle, ${plural(data.cycle.daysRemaining, "day")} remaining`
            : undefined
        }
        actions={
          <Button variant="outline" asChild>
            <Link href="/availability">Edit availability</Link>
          </Button>
        }
      />

      {overview.isPending ? (
        <Skeleton className="h-36 w-full" aria-busy="true" />
      ) : overview.isError ? (
        <Card>
          <PanelMessage onRetry={() => void overview.refetch()}>Dashboard figures unavailable.</PanelMessage>
        </Card>
      ) : (
        <>
          <LogsBlockedBanner logs={overview.data.overdueLogs} />
          <StatsStrip data={overview.data} />
        </>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <TodaySessions state={state} />
        {overview.isSuccess ? (
          <AtAGlance data={overview.data} />
        ) : (
          <Card className="gap-0 pt-5">
            {overview.isError ? <PanelMessage>Figures unavailable.</PanelMessage> : <PanelSkeleton rows={4} />}
          </Card>
        )}
      </div>

      <LatestReviews state={state} />
    </>
  );
}
