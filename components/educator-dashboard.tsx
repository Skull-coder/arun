"use client";

import { useState, useMemo, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AppSidebar, MobileAppSidebar, type NavItem } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { useGetQuizzes } from "@/hooks/tanstackQuery/quiz/use-get-quizzes";
import { useDeleteQuiz } from "@/hooks/tanstackQuery/quiz/use-delete-quiz";
import Link from "next/link";
import {
  FileQuestion,
  GraduationCap,
  BarChart2,
  Plus,
  Play,
  Trash2,
  Pencil,
  Search,
  Hash,
  Clock,
  Timer,
  Filter,
  Trophy,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EducatorClassrooms } from "./educator-classrooms";

type Props = {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string | null;
  };
};

// Removed static navItems

// Status: "draft" | "waiting" | "in_progress" | "completed"
const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "waiting", label: "Waiting" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

function statusVariant(status: string): "secondary" | "default" | "outline" | "destructive" {
  if (status === "draft") return "secondary";
  if (status === "waiting") return "outline";
  if (status === "in_progress") return "default";
  if (status === "completed") return "outline";
  return "secondary";
}

function statusLabel(status: string) {
  return { draft: "Draft", waiting: "Waiting", in_progress: "Live", completed: "Completed" }[status] ?? status;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function EducatorDashboard({ user }: Props) {
  const router = useRouter();
  const navItems: NavItem[] = [
    { label: "My Quizzes", icon: Timer, active: true, onClick: () => router.push("/dashboard") },
    { label: "Classrooms", icon: GraduationCap, active: false, onClick: () => router.push("/dashboard/classrooms") },
    { label: "Reports", icon: BarChart2, soon: true },
  ];

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetQuizzes();
  const quizzes = data?.pages?.flatMap(p => p.quizzes) || [];
  
  const { ref: observerRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  const { mutate: deleteQuiz, isPending: isDeleting } = useDeleteQuiz();

  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<any>(null);

  const filtered = useMemo(() => {
    if (!quizzes) return [];
    return quizzes.filter((q: any) => {
      const matchesSearch =
        !search ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        (q.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        q.joinCode.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quizzes, search, statusFilter]);

  const handleDelete = (quiz: any) => {
    setQuizToDelete(quiz);
  };

  const confirmDelete = async () => {
    if (!quizToDelete) return;
    const quiz = quizToDelete;
    setDeletingId(quiz.id);
    deleteQuiz(quiz.id, {
      onSuccess: async () => {
        toast.success(`"${quiz.title}" deleted successfully.`);
        await queryClient.invalidateQueries({ queryKey: ["quizzes"] });
        router.refresh();
        setDeletingId(null);
        setQuizToDelete(null);
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to delete quiz.");
        setDeletingId(null);
        setQuizToDelete(null);
      },
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── SIDEBAR ── */}
      <AppSidebar user={user} navItems={navItems} />

      {/* ── MAIN ── */}
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 md:px-8 py-4 md:py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center">
              <MobileAppSidebar user={user} navItems={navItems} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">My Quizzes</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {isLoading ? "Loading…" : `Manage and track your ${quizzes?.length ?? 0} quiz${quizzes?.length !== 1 ? "zes" : ""}`}
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="gap-2 shrink-0">
            <Link href="/dashboard/quiz/new">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Quiz</span>
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-border bg-card/50 px-4 md:px-8 py-3 shrink-0">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm w-full"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                    statusFilter === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Mobile Filters Dropdown */}
            <div className="md:hidden flex-1 sm:flex-none">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(search || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs shrink-0"
                onClick={() => { setSearch(""); setStatusFilter("all"); }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="flex flex-col h-full border-border/60 shadow-sm">
                  <CardHeader className="pb-4 gap-2 flex-row justify-between items-start space-y-0">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-3 gap-2">
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t mt-auto flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : !quizzes || quizzes.length === 0 ? (
            // Empty state — no quizzes at all
            <div className="flex flex-col items-center justify-center py-12 md:py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">No quizzes yet</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Create your first quiz to get started. It only takes a few minutes!
              </p>
              <Button asChild className="mt-6 gap-2">
                <Link href="/dashboard/quiz/new">
                  <Plus className="h-4 w-4" />
                  Create your first quiz
                </Link>
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            // Empty state — filtered results empty
            <div className="flex flex-col items-center justify-center py-12 md:py-24 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground">No results found</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((quiz: any) => {
                const isCompleted = quiz.status === "completed";
                const stats = [
                  {
                    icon: Hash,
                    value: quiz.totalQuestions ?? 0,
                    label: "Questions"
                  }
                ];
                if (!isCompleted) {
                  stats.push({
                    icon: Copy,
                    value: <code className="font-mono text-sm font-semibold text-foreground leading-none mt-0.5">{quiz.joinCode}</code>,
                    label: "Join Code"
                  });
                }

                return (
                  <DashboardCard
                    key={quiz.id}
                    title={quiz.title}
                    description={quiz.description}
                    statusNode={
                      <Badge variant={statusVariant(quiz.status ?? "draft")} className="text-xs">
                        {statusLabel(quiz.status ?? "draft")}
                      </Badge>
                    }
                    stats={stats}
                    footerLeft={
                      <>
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(quiz.createdAt)}
                      </>
                    }
                    footerRight={
                      <>
                        {isCompleted ? (
                          <>
                            <Button asChild variant="default" size="sm" className="h-8 gap-1.5 text-xs">
                              <Link href={`/quiz/${quiz.id}/results`}>
                                <Trophy className="h-3.5 w-3.5" />
                                Results
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                              <Link href={`/dashboard/quiz/new?clone=${quiz.id}`}>
                                <Copy className="h-3.5 w-3.5" />
                                Host Again
                              </Link>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button asChild variant="default" size="sm" className="h-8 gap-1.5 text-xs">
                              <Link href={`/dashboard/quiz/${quiz.id}/host`}>
                                <Play className="h-3.5 w-3.5" />
                                Host
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                              <Link href={`/dashboard/quiz/${quiz.id}/edit`}>
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Link>
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          disabled={deletingId === quiz.id}
                          onClick={() => handleDelete(quiz)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    }
                  />
                );
              })}
            </div>
          )}
          
          {hasNextPage && (
            <div ref={observerRef} className="py-8 flex justify-center">
              <span className="text-sm text-muted-foreground animate-pulse">Loading more quizzes...</span>
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quiz
              "{quizToDelete?.title}" and remove all of its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
