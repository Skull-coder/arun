"use client";

import { useGetTestResults } from "@/hooks/tanstackQuery/test/use-get-test-results";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Trophy,
  Award,
  FileText,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct = total > 0 ? Math.max(0, score / total) : 0;
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" width="144" height="144">
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none"
          stroke={pct >= 0.6 ? "#22c55e" : pct >= 0.35 ? "#f59e0b" : "#ef4444"}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">/ {total}</span>
      </div>
    </div>
  );
}

function renderAnswerValue(value: any): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function getOptionText(config: any, answerId: any, type: string): string {
  if (!answerId || answerId === null) return "Not answered";

  if (type === "single_choice") {
    const opts: any[] = config?.options ?? [];
    const opt = opts.find((o) => o.id === answerId);
    return opt ? opt.text : String(answerId);
  }

  if (type === "multi_choice") {
    const opts: any[] = config?.options ?? [];
    const ids: string[] = Array.isArray(answerId) ? answerId : [answerId];
    const texts = ids.map((id) => opts.find((o) => o.id === id)?.text ?? id);
    return texts.join(", ");
  }

  if (type === "sequence") {
    const items: any[] = config?.items ?? [];
    const ids: string[] = Array.isArray(answerId) ? answerId : [];
    const texts = ids.map((id) => items.find((i) => i.id === id)?.text ?? id);
    return texts.join(" → ");
  }

  if (type === "true_false") return answerId === true || answerId === "true" ? "True" : "False";

  return renderAnswerValue(answerId);
}

// ─── Question Review Card ─────────────────────────────────────────────────────

function QuestionReviewCard({ answerRow, index }: { answerRow: any; index: number }) {
  const isCorrect = answerRow.isCorrect;
  const isSkipped = answerRow.answer === null || answerRow.answer === undefined;

  const studentAnswer = getOptionText(answerRow.questionConfig, answerRow.answer, answerRow.questionType);
  const correctAnswer = getOptionText(answerRow.questionConfig, answerRow.correctAnswer, answerRow.questionType);

  return (
    <div className={cn(
      "rounded-xl border p-5 space-y-4 transition-colors",
      isSkipped
        ? "border-border bg-card"
        : isCorrect
        ? "border-green-500/20 bg-green-500/5"
        : "border-red-500/20 bg-red-500/5"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground mt-0.5">
            {index + 1}
          </span>
          <p className="text-sm font-medium leading-relaxed text-foreground">{answerRow.questionText}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isSkipped ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MinusCircle className="h-4 w-4" /> Skipped
            </div>
          ) : isCorrect ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4" /> +{answerRow.marks}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-500">
              <XCircle className="h-4 w-4" />
              {answerRow.score < 0 ? answerRow.score : "Wrong"}
            </div>
          )}
        </div>
      </div>

      {/* Answer comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cn("rounded-lg p-3 border text-xs space-y-1",
          isSkipped ? "border-border bg-muted/40"
          : isCorrect ? "border-green-500/30 bg-green-500/8"
          : "border-red-500/30 bg-red-500/8")}>
          <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">Your Answer</p>
          <p className={cn("font-medium", isSkipped ? "text-muted-foreground italic" : isCorrect ? "text-green-700" : "text-red-600")}>
            {isSkipped ? "Not answered" : studentAnswer}
          </p>
        </div>
        <div className="rounded-lg border border-green-500/30 bg-green-500/8 p-3 text-xs space-y-1">
          <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">Correct Answer</p>
          <p className="font-medium text-green-700">{correctAnswer}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentTestResultsClient({ classroomId, testId, targetStudentId }: { classroomId: number; testId: number; targetStudentId?: string }) {
  const { data, isLoading, error } = useGetTestResults(testId, targetStudentId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
        <Clock className="h-12 w-12 text-muted-foreground/40" />
        <div>
          <h2 className="text-lg font-semibold">Results Not Available Yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{error.message}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/classroom/${classroomId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Classroom
          </Link>
        </Button>
      </div>
    );
  }

  const { session, answers, test } = data;
  const totalScore = session?.totalScore ?? 0;
  const totalMarks = test.totalMarks ?? 0;
  const pct = totalMarks > 0 ? Math.round((Math.max(0, totalScore) / totalMarks) * 100) : 0;
  const correct = answers.filter((a: any) => a.isCorrect).length;
  const wrong = answers.filter((a: any) => !a.isCorrect && a.answer !== null && a.answer !== undefined).length;
  const skipped = answers.filter((a: any) => a.answer === null || a.answer === undefined).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur px-6 py-3 flex items-center gap-3">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href={targetStudentId ? `/dashboard/classroom/${classroomId}/test/${testId}/results` : `/dashboard/classroom/${classroomId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{test.title}</h1>
          <p className="text-xs text-muted-foreground">Results</p>
        </div>
        <Badge variant="secondary" className="text-xs">Completed</Badge>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        
        {!session && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 font-medium">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            You did not attempt this test. The score below reflects unanswered questions.
          </div>
        )}

        {/* Score card */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center gap-6">
          <ScoreRing score={totalScore} total={totalMarks} />
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <p className="text-sm text-muted-foreground">Your Score</p>
              <p className="text-4xl font-bold text-foreground">{totalScore} <span className="text-xl font-normal text-muted-foreground">/ {totalMarks}</span></p>
              <p className={cn("text-sm font-medium mt-1",
                pct >= 60 ? "text-green-600" : pct >= 35 ? "text-amber-500" : "text-red-500")}>
                {pct}% — {pct >= 60 ? "🎉 Well done!" : pct >= 35 ? "Keep practicing" : "Needs improvement"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-green-500/20 bg-green-500/8 p-3 text-center">
                <p className="text-xl font-bold text-green-600">{correct}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Correct</p>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/8 p-3 text-center">
                <p className="text-xl font-bold text-red-500">{wrong}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Wrong</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-3 text-center">
                <p className="text-xl font-bold text-muted-foreground">{skipped}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Skipped</p>
              </div>
            </div>
          </div>
        </div>

        {test.isNegativeMarking && (
          <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-2.5 text-sm text-orange-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Negative marking was enabled. Wrong answers deducted 1 mark each.
          </div>
        )}

        {/* Question review */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Question Analysis</h2>
          {answers.map((a: any, idx: number) => (
            <QuestionReviewCard key={a.id ?? idx} answerRow={a} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
