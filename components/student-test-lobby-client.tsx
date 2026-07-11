"use client";

import { useEffect, useState } from "react";
import { useGetTest } from "@/hooks/tanstackQuery/test/use-get-test";
import { useGetMySession } from "@/hooks/tanstackQuery/test/use-get-my-session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  FileText,
  Award,
  AlertCircle,
  CheckCircle2,
  Play,
  Trophy,
  Calendar,
  Shield,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function useCountdown(targetIso: string | null) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!targetIso) {
      setTimeLeft(null);
      return;
    }

    // Add 2000ms buffer to ensure server clock has passed the scheduled time
    const target = new Date(targetIso).getTime() + 2000;

    const tick = () => {
      const diff = target - Date.now();
      setTimeLeft(Math.max(0, diff));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  return timeLeft;
}

function CountdownDisplay({ ms }: { ms: number }) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = days === 0 && hours === 0 && minutes < 10;

  if (days > 0) {
    return (
      <div className="flex items-center gap-3">
        <TimeUnit value={days} label="days" />
        <Colon />
        <TimeUnit value={hours} label="hrs" />
        <Colon />
        <TimeUnit value={minutes} label="min" />
        <Colon />
        <TimeUnit value={seconds} label="sec" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <TimeUnit value={hours} label="hrs" highlight={isUrgent} />
      <Colon />
      <TimeUnit value={minutes} label="min" highlight={isUrgent} />
      <Colon />
      <TimeUnit value={seconds} label="sec" highlight={isUrgent} />
    </div>
  );
}

function TimeUnit({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-2xl border w-20 h-20 transition-colors",
      highlight
        ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
        : "border-border bg-card text-foreground"
    )}>
      <span className="text-3xl font-bold font-mono tabular-nums leading-none">{String(value).padStart(2, "0")}</span>
      <span className={cn("text-xs mt-1 font-medium uppercase tracking-widest", highlight ? "text-orange-400/70" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

function Colon() {
  return <span className="text-3xl font-bold text-muted-foreground/40 leading-none pb-4">:</span>;
}

// ─── Info Card ────────────────────────────────────────────────────────────────

function InfoCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border p-4",
      accent ? "border-primary/20 bg-primary/5" : "border-border bg-card"
    )}>
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        accent ? "bg-primary/15" : "bg-muted"
      )}>
        <Icon className={cn("h-4 w-4", accent ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-semibold", accent && "text-primary")}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentTestLobbyClient({
  classroomId,
  testId,
}: {
  classroomId: number;
  testId: number;
}) {
  const { data, isLoading } = useGetTest(testId, 10000);
  const { data: sessionData, isLoading: isSessionLoading } = useGetMySession(testId);
  
  const test = data?.test;
  const session = sessionData?.session;
  const alreadySubmitted = session?.status === "completed" || session?.status === "auto_submitted";

  const scheduledIso = test?.scheduledAt ?? null;
  const timeLeft = useCountdown(scheduledIso);
  const scheduledDate = scheduledIso ? new Date(scheduledIso) : null;
  // Tie the optimistic UI check to the 2000ms buffer used in the countdown
  const isTimePassed = scheduledDate && (scheduledDate.getTime() + 2000) <= Date.now();
  
  // Optimistic UI: if time has passed locally, we show live even if backend still says scheduled
  const isLive = test?.status === "ongoing" || (test?.status === "scheduled" && isTimePassed);
  const isCompleted = test?.status === "completed";
  const isScheduled = test?.status === "scheduled" && !isTimePassed;

  // ── Loading ──
  if (isLoading || isSessionLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-border bg-card/50 px-6 py-4 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl space-y-6">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground font-medium">Test not found</p>
        <Button asChild variant="outline">
          <Link href={`/dashboard/classroom/${classroomId}`}><ArrowLeft className="h-4 w-4 mr-2" />Back to Classroom</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top Nav ── */}
      <header className="border-b border-border bg-card/80 backdrop-blur px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/dashboard/classroom/${classroomId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">Classroom</p>
        </div>
        {isLive && (
          <span className="relative flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-medium text-green-600">LIVE NOW</span>
          </span>
        )}
        {isCompleted && <Badge variant="secondary" className="text-muted-foreground">Completed</Badge>}
        {isScheduled && <Badge variant="secondary">Upcoming</Badge>}
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">

          {/* Title */}
          <div className="text-center space-y-2">
            <div className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-3 border",
              isLive
                ? "border-green-500/30 bg-green-500/10 text-green-600"
                : isCompleted
                ? "border-border bg-muted text-muted-foreground"
                : "border-primary/30 bg-primary/10 text-primary"
            )}>
              {isLive ? <><Zap className="h-3 w-3" /> Test is Live</> : isCompleted ? <>Completed</> : <><Calendar className="h-3 w-3" /> Upcoming Test</>}
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{test.title}</h1>
            {test.description && (
              <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">{test.description}</p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCard icon={FileText} label="Questions" value={test.totalQuestions ?? "—"} />
            <InfoCard icon={Award} label="Total Marks" value={test.totalMarks ?? "—"} accent />
            <InfoCard icon={Clock} label="Duration" value={`${test.durationMinutes} min`} />
            <InfoCard
              icon={Shield}
              label="Neg. Marking"
              value={test.isNegativeMarking ? "-1 per wrong" : "None"}
            />
          </div>

          {/* Scheduled time */}
          {scheduledDate && (
            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Scheduled for <strong className="text-foreground">{scheduledDate.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</strong></span>
            </div>
          )}

          {/* ── Countdown / CTA Block ── */}
          <div className={cn(
            "rounded-2xl border p-8 flex flex-col items-center gap-6 text-center",
            isLive
              ? "border-green-500/20 bg-green-500/5"
              : isCompleted
              ? "border-border bg-card"
              : isTimePassed
              ? "border-primary/20 bg-primary/5"
              : "border-border bg-card"
          )}>

            {/* Live */}
            {isLive && (
              <>
                {alreadySubmitted ? (
                  <>
                    <div className="space-y-1">
                      <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                      <p className="text-lg font-semibold text-green-600">Test Submitted!</p>
                      <p className="text-sm text-muted-foreground">Your answers have been recorded. Waiting for the educator to end the test.</p>
                    </div>
                    <Button size="lg" disabled className="gap-2 h-12 px-10 text-base opacity-50">
                      <Clock className="h-5 w-5" /> Waiting for test to end…
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-green-600">The test is live!</p>
                      <p className="text-sm text-muted-foreground">Your educator has started the test. You can begin now.</p>
                    </div>
                    <Button size="lg" className="gap-2 h-12 px-10 text-base font-semibold" asChild>
                      <Link href={`/dashboard/classroom/${classroomId}/test/${testId}/take`}>
                        <Play className="h-5 w-5" /> Begin Test
                      </Link>
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Completed */}
            {isCompleted && (
              <>
                <div className="space-y-1">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-lg font-semibold text-foreground">Test has ended</p>
                  <p className="text-sm text-muted-foreground">This test is now closed. Check your results below.</p>
                </div>
                <Button size="lg" variant="outline" className="gap-2 h-12 px-10 text-base" asChild>
                  <Link href={`/dashboard/classroom/${classroomId}/test/${testId}/results`}>
                    <Trophy className="h-5 w-5" /> View Results
                  </Link>
                </Button>
              </>
            )}

            {/* Scheduled — countdown */}
            {isScheduled && (
              <>
                <div className="space-y-1">
                  {scheduledDate ? (
                    <>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Starts in</p>
                      {timeLeft !== null && <CountdownDisplay ms={timeLeft} />}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                      <p className="text-base font-medium text-foreground">No schedule set yet</p>
                      <p className="text-sm text-muted-foreground">Your educator hasn't set a start time. Check back soon.</p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="rounded-xl border border-border bg-card/60 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" /> Before You Begin
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/50" />
                Make sure you have a stable internet connection.
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/50" />
                The test has <strong className="text-foreground">{test.durationMinutes} minutes</strong> total time. Once started, the timer runs continuously.
              </li>
              {test.isNegativeMarking && (
                <li className="flex items-start gap-2 text-orange-500">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span><strong>Negative marking is enabled.</strong> Each wrong answer will deduct 1 mark.</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/50" />
                Do not refresh or navigate away during the test.
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
