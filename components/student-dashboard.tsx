"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppSidebar, type NavItem } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetQuizzes } from "@/hooks/tanstackQuery/quiz/use-get-quizzes";
import { useJoinQuiz } from "@/hooks/tanstackQuery/quiz/use-join-quiz";
import Link from "next/link";
import {
  GraduationCap,
  BarChart2,
  Search,
  Clock,
  Trophy,
  Hash,
  Star,
  Zap,
  BookOpen,
  ArrowRight,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string | null;
    rollNumber?: string | null;
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${rem}s`;
}

function quizStatusVariant(status: string): "secondary" | "default" | "outline" | "destructive" {
  if (status === "completed") return "outline";
  if (status === "in_progress") return "default";
  if (status === "waiting") return "secondary";
  return "secondary";
}

function quizStatusLabel(status: string) {
  return (
    { draft: "Draft", waiting: "Waiting", in_progress: "Live", completed: "Completed" }[status] ??
    status
  );
}

function scoreColor(score: number, total: number | null) {
  if (!total || total === 0) return "text-muted-foreground";
  const pct = (score / total) * 100;
  if (pct >= 80) return "text-green-500";
  if (pct >= 50) return "text-orange-500";
  return "text-destructive";
}

// ─── Join Quiz Dialog ─────────────────────────────────────────────────────────

function JoinQuizDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const { mutate: joinQuiz, isPending } = useJoinQuiz();
  const router = useRouter();

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Please enter a join code.");
      return;
    }
    joinQuiz(
      { joinCode: trimmed },
      {
        onSuccess: (data: any) => {
          toast.success("Joined quiz!");
          onOpenChange(false);
          router.push(`/quiz/${data.quizId}`);
        },
        onError: (err: Error) => {
          toast.error(err.message || "Invalid or expired code.");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Join a Quiz
          </DialogTitle>
          <DialogDescription>
            Enter the join code provided by your educator to jump in.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            placeholder="Enter code e.g. XK9M2P"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className="font-mono tracking-widest text-center text-lg h-12 uppercase"
            maxLength={10}
            autoFocus
          />
          <Button
            onClick={handleJoin}
            disabled={isPending || !code.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {isPending ? "Joining…" : "Join Quiz"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const studentNavItems: NavItem[] = [
  { label: "My Quizzes", icon: BookOpen, active: true },
  { label: "Classrooms", icon: GraduationCap, soon: true },
  { label: "Performance", icon: BarChart2, soon: true },
];

export default function StudentDashboard({ user }: Props) {
  const { data: sessions, isLoading } = useGetQuizzes();
  const [search, setSearch] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!sessions) return [];
    if (!search) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(
      (s: any) =>
        s.quizTitle.toLowerCase().includes(q) ||
        (s.quizDescription ?? "").toLowerCase().includes(q)
    );
  }, [sessions, search]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalPlayed = sessions?.length ?? 0;
  const totalScore = sessions?.reduce((a: number, s: any) => a + (s.totalScore ?? 0), 0) ?? 0;
  const avgScore =
    totalPlayed > 0 ? Math.round(totalScore / totalPlayed) : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── SIDEBAR ── */}
      <AppSidebar user={user} navItems={studentNavItems} />

      {/* ── MAIN ── */}
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-8 py-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">My Quizzes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading
                ? "Loading…"
                : `${totalPlayed} quiz${totalPlayed !== 1 ? "zes" : ""} played`}
            </p>
          </div>
          <Button onClick={() => setJoinOpen(true)} className="gap-2" size="sm">
            <Zap className="h-4 w-4" />
            Join a Quiz
          </Button>
        </div>

        {/* Stats strip */}
        {!isLoading && totalPlayed > 0 && (
          <div className="flex items-center gap-6 border-b border-border bg-card/40 px-8 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Played:</span>
              <span className="font-semibold text-foreground">{totalPlayed}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total score:</span>
              <span className="font-semibold text-foreground">{totalScore}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Avg score:</span>
              <span className="font-semibold text-foreground">{avgScore}</span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3 border-b border-border bg-card/50 px-8 py-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search quizzes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              onClick={() => setSearch("")}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Table / States */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : !sessions || sessions.length === 0 ? (
            /* Empty — never played */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <GraduationCap className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">No quizzes yet</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Join your first quiz using a code from your educator to get started.
              </p>
              <Button className="mt-6 gap-2" onClick={() => setJoinOpen(true)}>
                <Zap className="h-4 w-4" />
                Join a Quiz
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            /* Empty — search filtered */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground">No results found</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Quiz</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Out of</TableHead>
                  <TableHead>Time Taken</TableHead>
                  <TableHead>Played On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((session: any) => (
                  <TableRow key={session.sessionId} className="group">
                    {/* Quiz title */}
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground text-sm">{session.quizTitle}</p>
                        {session.quizDescription && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {session.quizDescription}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Quiz status */}
                    <TableCell>
                      <Badge
                        variant={quizStatusVariant(session.quizStatus)}
                        className="text-xs"
                      >
                        {quizStatusLabel(session.quizStatus)}
                      </Badge>
                    </TableCell>

                    {/* Student's score */}
                    <TableCell>
                      <span
                        className={cn(
                          "font-semibold text-sm",
                          scoreColor(session.totalScore, session.quizTotalMarks)
                        )}
                      >
                        {session.totalScore}
                      </span>
                    </TableCell>

                    {/* Max possible marks */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {session.quizTotalMarks ?? "—"}
                      </span>
                    </TableCell>

                    {/* Time taken */}
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        {session.totalTimeTakenMs > 0
                          ? formatMs(session.totalTimeTakenMs)
                          : "—"}
                      </span>
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(session.startedAt)}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        {session.quizStatus === "completed" ? (
                          <Button
                            asChild
                            variant="default"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                          >
                            <Link href={`/quiz/${session.quizId}/results`}>
                              <Trophy className="h-3.5 w-3.5" />
                              View Results
                            </Link>
                          </Button>
                        ) : session.quizStatus === "in_progress" ||
                          session.quizStatus === "waiting" ? (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                          >
                            <Link href={`/quiz/${session.quizId}`}>
                              <Zap className="h-3.5 w-3.5" />
                              Rejoin
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      {/* Join Quiz Dialog */}
      <JoinQuizDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
}
