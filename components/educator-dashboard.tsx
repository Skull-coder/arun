"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AppSidebar, type NavItem } from "@/components/app-sidebar";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useGetQuizzes } from "@/hooks/tanstackQuery/quiz/use-get-quizzes";
import { useDeleteQuiz } from "@/hooks/tanstackQuery/quiz/use-delete-quiz";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  BarChart2,
  Plus,
  Play,
  Trash2,
  Pencil,
  Search,
  Hash,
  Clock,
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
    { label: "Library", icon: BookOpen, active: true, onClick: () => router.push("/dashboard") },
    { label: "Classrooms", icon: GraduationCap, active: false, onClick: () => router.push("/dashboard/classrooms") },
    { label: "Reports", icon: BarChart2, soon: true },
  ];

  const { data: quizzes, isLoading } = useGetQuizzes();
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
        <div className="flex items-center justify-between border-b border-border px-8 py-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">My Quiz Library</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Loading…" : `${quizzes?.length ?? 0} quiz${quizzes?.length !== 1 ? "zes" : ""} created`}
            </p>
          </div>
          <Button asChild size="sm" className="gap-2">
            <Link href="/dashboard/quiz/new">
              <Plus className="h-4 w-4" />
              Create Quiz
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 border-b border-border bg-card/50 px-8 py-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
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
          {(search || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : !quizzes || quizzes.length === 0 ? (
            // Empty state — no quizzes at all
            <div className="flex flex-col items-center justify-center py-24 text-center">
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
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground">No results found</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filter.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Join Code</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((quiz: any) => (
                  <TableRow key={quiz.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground text-sm">{quiz.title}</p>
                        {quiz.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {quiz.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(quiz.status ?? "draft")} className="text-xs">
                        {statusLabel(quiz.status ?? "draft")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" />
                        {quiz.totalQuestions ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono tracking-wider text-foreground">
                        {quiz.joinCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(quiz.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(quiz.updatedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        {quiz.status === "completed" ? (
                          <>
                            <Button asChild variant="default" size="sm" className="h-8 gap-1.5 text-xs">
                              <Link href={`/quiz/${quiz.id}/results`}>
                                <Trophy className="h-3.5 w-3.5" />
                                View Results
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
                          onClick={() => {
                            handleDelete(quiz);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
