"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGetTest } from "@/hooks/tanstackQuery/test/use-get-test";
import { useUpdateTest } from "@/hooks/tanstackQuery/test/use-update-test";
import { useDeleteTest } from "@/hooks/tanstackQuery/test/use-delete-test";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast as sonnerToast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Play,
  Square,
  Eye,
  EyeOff,
  Clock,
  Award,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type TestStatus = "scheduled" | "ongoing" | "completed";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "ongoing") {
    return (
      <span className="relative inline-flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs font-medium text-green-600">Live</span>
      </span>
    );
  }
  return (
    <Badge variant="secondary" className={cn("capitalize text-xs", status === "completed" && "text-muted-foreground")}>
      {status === "scheduled" ? "Upcoming" : status}
    </Badge>
  );
}

function TypeLabel(type: string) {
  const map: Record<string, string> = {
    single_choice: "SCQ", multi_choice: "MCQ", true_false: "T/F", text: "Text", sequence: "Seq",
  };
  return map[type] ?? type;
}

// ─── Normal (Educator Management) View ───────────────────────────────────────

function NormalView({ classroomId, testId, test, questions, onUpdate, onDelete, isUpdating, isDeleting }: any) {
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm("Delete this test? This cannot be undone.")) return;
    onDelete({ id: testId, classroomId }, {
      onSuccess: () => { toast.success("Test deleted."); router.push(`/dashboard/classroom/${classroomId}`); },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleStart = () => onUpdate({ id: testId, status: "ongoing" }, { onSuccess: () => toast.success("Test is now live!"), onError: (err: Error) => toast.error(err.message) });
  const handleEnd = () => onUpdate({ id: testId, status: "completed" }, { onSuccess: () => toast.success("Test ended."), onError: (err: Error) => toast.error(err.message) });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-border bg-card/50 px-8 py-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href={`/dashboard/classroom/${classroomId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold truncate">{test.title}</h1>
            <StatusBadge status={test.status} />
          </div>
          {test.description && <p className="text-sm text-muted-foreground mt-0.5 truncate">{test.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/dashboard/classroom/${classroomId}/test/${testId}?preview=true`}>
              <Eye className="h-4 w-4" /> Preview
            </Link>
          </Button>
          {(test.status === "scheduled" || test.status === "draft") && (
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href={`/dashboard/classroom/${classroomId}/test/${testId}/edit`}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
          )}
          {(test.status === "scheduled" || test.status === "draft") && (
            <Button size="sm" className="gap-2" onClick={handleStart} disabled={isUpdating}>
              <Play className="h-4 w-4" /> Start Test
            </Button>
          )}
          {test.status === "ongoing" && (
            <Button size="sm" variant="destructive" className="gap-2" onClick={handleEnd} disabled={isUpdating}>
              <Square className="h-4 w-4" /> End Test
            </Button>
          )}
          {test.status !== "ongoing" && (
            <Button size="sm" variant="ghost" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Clock, label: "Duration", value: `${test.durationMinutes} min` },
              { icon: FileText, label: "Questions", value: test.totalQuestions ?? "—" },
              { icon: Award, label: "Total Marks", value: test.totalMarks ?? "—" },
              { icon: CheckCircle2, label: "Scheduled", value: test.scheduledAt ? new Date(test.scheduledAt).toLocaleDateString() : "—" },
              { icon: test.isNegativeMarking ? CheckSquare : Square, label: "Negative Marking", value: test.isNegativeMarking ? "Yes (-1)" : "No" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-base font-semibold">{String(value)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Questions table */}
          {questions.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-base font-semibold">Questions ({questions.length})</h2>
              <div className="rounded-md border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="w-20">Type</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead className="w-20 text-right">Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((q: any, idx: number) => (
                      <TableRow key={q.id}>
                        <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{TypeLabel(q.type)}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate font-medium text-sm">{q.text}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{q.marks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">No questions added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Preview (Student Exam Simulation) View ───────────────────────────────────

function PreviewView({ classroomId, testId, test, questions }: any) {
  const [activeQ, setActiveQ] = useState(0);
  const q = questions[activeQ];

  const optionClass = (selected: boolean) =>
    cn("w-full text-left rounded-lg border-2 px-4 py-3 text-sm transition-all",
      selected ? "border-primary bg-primary/5 font-medium" : "border-border bg-card hover:border-primary/40 hover:bg-muted/40");

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sticky header */}
        <header className="flex items-center justify-between border-b border-border bg-card/95 px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-sm truncate max-w-xs">{test.title}</h1>
            <Badge variant="secondary" className="text-xs">PREVIEW MODE</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-muted rounded-lg px-3 py-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono font-bold text-sm">{String(test.durationMinutes).padStart(2, "0")}:00</span>
            </div>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href={`/dashboard/classroom/${classroomId}/test/${testId}`}>
                <EyeOff className="h-4 w-4" /> Exit Preview
              </Link>
            </Button>
          </div>
        </header>

        {/* Question area */}
        <div className="flex-1 overflow-y-auto p-8">
          {q ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Question {activeQ + 1} of {questions.length}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{q.marks} marks</Badge>
                </div>
              </div>

              <p className="text-lg font-medium leading-relaxed">{q.text}</p>

              {/* Answer options */}
              {q.type === "single_choice" && (
                <div className="space-y-2">
                  {(q.config?.options ?? []).map((opt: any, idx: number) => (
                    <button key={opt.id} className={optionClass(false)}>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted text-xs font-bold mr-3">{"ABCDE"[idx]}</span>
                      {opt.text || <span className="text-muted-foreground italic">Option {idx + 1}</span>}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "multi_choice" && (
                <div className="space-y-2">
                  {(q.config?.options ?? []).map((opt: any, idx: number) => (
                    <button key={opt.id} className={optionClass(false)}>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded border-2 border-border mr-3 text-xs">□</span>
                      {opt.text || <span className="text-muted-foreground italic">Option {idx + 1}</span>}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "true_false" && (
                <div className="flex gap-3">
                  <button className={optionClass(false)}>✓ True</button>
                  <button className={optionClass(false)}>✗ False</button>
                </div>
              )}

              {q.type === "text" && (
                <input disabled placeholder="Your answer…" className="w-full rounded-lg border-2 border-border bg-muted px-4 py-3 text-sm text-muted-foreground cursor-not-allowed" />
              )}

              {q.type === "sequence" && (
                <div className="space-y-2">
                  {(q.config?.items ?? []).map((item: any, idx: number) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                      <span className="text-xs text-muted-foreground font-mono">{idx + 1}</span>
                      <span className="text-sm">{item.text || <span className="italic text-muted-foreground">Item {idx + 1}</span>}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" size="sm" className="gap-2" disabled={activeQ === 0} onClick={() => setActiveQ(activeQ - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button size="sm" className="gap-2" disabled={activeQ === questions.length - 1} onClick={() => setActiveQ(activeQ + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <FileText className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No questions in this test yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right info panel */}
      <aside className="flex w-64 shrink-0 flex-col border-l border-border bg-card p-4 gap-4 overflow-y-auto">
        <div className="rounded-lg bg-muted p-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questions Palette</p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_: any, idx: number) => (
              <button key={idx} onClick={() => setActiveQ(idx)}
                className={cn("flex h-8 w-full items-center justify-center rounded text-xs font-medium transition-colors border",
                  activeQ === idx ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted")}>
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-muted p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Test Info</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Questions</span><span className="font-medium">{questions.length}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total Marks</span><span className="font-medium">{test.totalMarks ?? "—"}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Neg. Marking</span><span className="font-medium">{test.isNegativeMarking ? "Yes (-1)" : "No"}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Duration</span><span className="font-medium">{test.durationMinutes} min</span></div>
          </div>
        </div>

        <Button className="w-full" disabled>Submit Test</Button>
        <p className="text-xs text-muted-foreground text-center">Preview Mode — answers are not saved</p>
      </aside>
    </div>
  );
}

// ─── Root Component ──────────────────────────────────────────────────────────

export function TestDetailClient({ classroomId, testId, isPreview }: { classroomId: number; testId: number; isPreview: boolean }) {
  const { data, isLoading } = useGetTest(testId);
  const { mutate: updateTest, isPending: isUpdating } = useUpdateTest();
  const { mutate: deleteTest, isPending: isDeleting } = useDeleteTest();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data?.test) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">Test not found</p>
        <Button asChild variant="outline"><Link href={`/dashboard/classroom/${classroomId}`}><ArrowLeft className="h-4 w-4 mr-2" />Back to Classroom</Link></Button>
      </div>
    );
  }

  const { test, questions = [] } = data;

  if (isPreview) {
    return <PreviewView classroomId={classroomId} testId={testId} test={test} questions={questions} />;
  }

  return (
    <NormalView
      classroomId={classroomId}
      testId={testId}
      test={test}
      questions={questions}
      onUpdate={updateTest}
      onDelete={deleteTest}
      isUpdating={isUpdating}
      isDeleting={isDeleting}
    />
  );
}
