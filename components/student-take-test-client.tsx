"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGetTest } from "@/hooks/tanstackQuery/test/use-get-test";
import { useGetMySession } from "@/hooks/tanstackQuery/test/use-get-my-session";
import { useSubmitTest } from "@/hooks/tanstackQuery/test/use-submit-test";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// ─── Live test timer ──────────────────────────────────────────────────────────

function useTestTimer(endAt: string | null, onExpire: () => void) {
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!endAt) return 0;
    const endTime = new Date(endAt).getTime();
    return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!endAt) return;
    const endTime = new Date(endAt).getTime();
    let expired = false;

    const tick = () => {
      if (expired) return;
      const remaining = Math.floor((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        expired = true;
        setSecondsLeft(0);
        onExpireRef.current();
      } else {
        setSecondsLeft(remaining);
      }
    };

    // Run tick immediately to sync, then start interval
    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      expired = true;
      clearInterval(interval);
    };
  }, [endAt]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 5 * 60;

  return { minutes, seconds, isUrgent };
}

// ─── Answer helpers ───────────────────────────────────────────────────────────

type Answers = Record<number, any>; // questionIndex → answer value

function isAnswered(answer: any): boolean {
  if (answer === undefined || answer === null) return false;
  if (typeof answer === "string") return answer.trim() !== "";
  if (Array.isArray(answer)) return answer.length > 0;
  return true;
}

// ─── Option classes ───────────────────────────────────────────────────────────

function optionClass(selected: boolean) {
  return cn(
    "w-full text-left rounded-lg border-2 px-4 py-3 text-sm transition-all duration-150",
    selected
      ? "border-primary bg-primary/8 font-medium text-foreground"
      : "border-border bg-card hover:border-primary/40 hover:bg-muted/40 text-foreground"
  );
}

// ─── Answer editors ───────────────────────────────────────────────────────────

function SingleChoiceAnswer({ q, answer, onChange }: { q: any; answer: any; onChange: (v: any) => void }) {
  return (
    <div className="space-y-2.5">
      {(q.config?.options ?? []).map((opt: any, idx: number) => (
        <button key={opt.id} onClick={() => onChange(opt.id)} className={optionClass(answer === opt.id)}>
          <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold mr-3",
            answer === opt.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            {"ABCDE"[idx]}
          </span>
          {opt.text || <span className="text-muted-foreground italic">Option {idx + 1}</span>}
        </button>
      ))}
    </div>
  );
}

function MultiChoiceAnswer({ q, answer, onChange }: { q: any; answer: any; onChange: (v: any) => void }) {
  const selected: string[] = Array.isArray(answer) ? answer : [];
  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    onChange(next);
  };
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-muted-foreground">Select all that apply</p>
      {(q.config?.options ?? []).map((opt: any, idx: number) => {
        const isChecked = selected.includes(opt.id);
        return (
          <button key={opt.id} onClick={() => toggle(opt.id)} className={optionClass(isChecked)}>
            <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded border-2 mr-3 text-xs font-bold",
              isChecked ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent")}>✓</span>
            {opt.text || <span className="text-muted-foreground italic">Option {idx + 1}</span>}
          </button>
        );
      })}
    </div>
  );
}

function TrueFalseAnswer({ answer, onChange }: { answer: any; onChange: (v: any) => void }) {
  return (
    <div className="flex gap-3">
      {([true, false] as const).map((val) => (
        <button key={String(val)} onClick={() => onChange(val)}
          className={cn("flex flex-1 items-center justify-center rounded-xl border-2 py-8 text-base font-semibold transition-all",
            answer === val ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted")}>
          {val ? "✓  True" : "✗  False"}
        </button>
      ))}
    </div>
  );
}

function TextAnswer({ answer, onChange }: { answer: any; onChange: (v: any) => void }) {
  return (
    <textarea value={answer ?? ""} onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer here…"
      className="w-full rounded-lg border-2 border-border bg-card px-4 py-3 text-sm resize-none min-h-[120px] focus:outline-none focus:border-primary transition-colors" />
  );
}

function SequenceAnswer({ q, answer, onChange }: { q: any; answer: any; onChange: (v: any) => void }) {
  const items: any[] = q.config?.items ?? [];
  const sequenceOrder: string[] = Array.isArray(answer) ? answer : [];

  const handleSequenceClick = (itemId: string) => {
    if (sequenceOrder.includes(itemId)) {
      onChange(sequenceOrder.filter((id) => id !== itemId));
    } else {
      onChange([...sequenceOrder, itemId]);
    }
  };

  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <p className="text-sm text-muted-foreground mb-2">Tap the items in the correct order to select them (1, 2, 3...):</p>
      {items.map((item: any) => {
        const indexInOrder = sequenceOrder.indexOf(item.id);
        const isSelected = indexInOrder !== -1;

        return (
          <button
            key={item.id}
            onClick={() => handleSequenceClick(item.id)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border-4 text-left transition-all active:scale-95 shadow-sm relative",
              isSelected 
                ? "border-primary bg-primary/10" 
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold z-10",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {isSelected ? indexInOrder + 1 : ""}
            </div>
            
            <span className={cn(
              "flex-1 text-base z-10",
              isSelected ? "font-medium text-foreground" : "text-muted-foreground"
            )}>
              {item.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Submitted waiting screen ─────────────────────────────────────────────────

function SubmittedWaiting({ classroomId, testId, testStatus }: { classroomId: number; testId: number; testStatus?: string }) {
  const isCompleted = testStatus === "completed";

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 ring-4 ring-green-500/20">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Test Submitted!</h2>
        <p className="text-muted-foreground max-w-sm">
          Your answers have been recorded. {isCompleted ? "The test has ended and results are now available." : "Results will be available once the test ends."}
        </p>
      </div>
      
      {!isCompleted && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3">
          <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
          <span className="text-sm text-muted-foreground">Waiting for test to end…</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/classroom/${classroomId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Classroom
          </Link>
        </Button>
        
        {/* Results button */}
        {isCompleted ? (
          <Button asChild className="gap-2">
            <Link href={`/dashboard/classroom/${classroomId}/test/${testId}/results`}>
              View Results
            </Link>
          </Button>
        ) : (
          <div className="space-y-1 text-center">
            <Button disabled className="gap-2 opacity-40 cursor-not-allowed w-full">
              View Results
            </Button>
            <p className="text-xs text-muted-foreground">Available after test ends</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentTakeTestClient({ classroomId, testId }: { classroomId: number; testId: number }) {
  const router = useRouter();
  const { data, isLoading, refetch } = useGetTest(testId, 10000); // Poll every 10s
  const { data: sessionData, isLoading: isSessionLoading } = useGetMySession(testId);
  const { mutate: submitTest, isPending: isSubmitting } = useSubmitTest();

  const [activeQ, setActiveQ] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [shuffledIds, setShuffledIds] = useState<number[] | null>(null);

  useEffect(() => {
    if (data?.questions && data.questions.length > 0 && !shuffledIds) {
      const ids = data.questions.map((q: any) => q.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      setShuffledIds(ids);
    }
  }, [data?.questions, shuffledIds]);

  useEffect(() => {
    if (sessionData?.session && (sessionData.session.status === "completed" || sessionData.session.status === "auto_submitted")) {
      setSubmitted(true);
    }
  }, [sessionData]);

  const test = data?.test;
  const questions: any[] = shuffledIds && data?.questions 
    ? shuffledIds.map(id => data.questions.find((q: any) => q.id === id)).filter(Boolean)
    : [];

  const doSubmit = useCallback((isAutoSubmit = false) => {
    if (submitted) return;
    const answerPayload = questions.map((q: any, idx: number) => ({
      questionId: q.id,
      answer: answers[idx] ?? null,
    }));

    submitTest(
      { testId, answers: answerPayload },
      {
        onSuccess: () => {
          setSubmitted(true);
          if (isAutoSubmit) toast.info("Time's up! Your test was automatically submitted.");
        },
        onError: (err: Error) => {
          if (err.message.includes("already submitted")) {
            setSubmitted(true);
          } else {
            toast.error(err.message);
          }
        },
      }
    );
  }, [questions, answers, testId, submitTest, submitted]);

  const handleExpire = useCallback(() => doSubmit(true), [doSubmit]);

  const { minutes, seconds, isUrgent } = useTestTimer(
    test?.endAt ?? null,
    handleExpire
  );

  const q = questions[activeQ];
  const answeredCount = questions.filter((_, i) => isAnswered(answers[i])).length;

  const setAnswer = (value: any) => setAnswers((prev) => ({ ...prev, [activeQ]: value }));

  // Guard: handle remote status changes
  useEffect(() => {
    if (!test) return;

    if (test.status === "completed" && !submitted && !isSubmitting) {
      toast.info("The educator has ended the test. Your answers are being submitted.");
      doSubmit(true);
    } else if (test.status === "scheduled") {
      router.replace(`/dashboard/classroom/${classroomId}/test/${testId}/lobby`);
    }
  }, [test, submitted, isSubmitting, doSubmit, classroomId, testId, router]);

  // Aggressive retry if questions are missing (race condition mitigation)
  useEffect(() => {
    if (test && data?.questions?.length === 0 && !isLoading) {
      const timer = setInterval(() => {
        refetch();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [test, data?.questions?.length, isLoading, refetch]);

  // ── Loading ──
  if (isLoading || isSessionLoading || (data?.questions?.length && !shuffledIds)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-4 w-64 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading test…</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground font-medium">Test not found</p>
        <Button asChild variant="outline">
          <Link href={`/dashboard/classroom/${classroomId}/test/${testId}/lobby`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Lobby
          </Link>
        </Button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground/40" />
        <p className="text-muted-foreground font-medium">Preparing test environment…</p>
        <p className="text-xs text-muted-foreground/60">Waiting for server sync</p>
      </div>
    );
  }

  // ── Submitted: waiting for test to end ──
  if (submitted) {
    return <SubmittedWaiting classroomId={classroomId} testId={testId} testStatus={test?.status} />;
  }

  // Inline dialog below instead of a nested component
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-card/95 px-6 py-3 backdrop-blur sticky top-0 z-10">
          <h1 className="font-semibold text-sm truncate max-w-xs">{test.title}</h1>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono font-bold text-sm tabular-nums transition-colors",
              isUrgent ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-muted text-foreground"
            )}>
              <Clock className={cn("h-4 w-4", isUrgent && "animate-pulse")} />
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="gap-2" disabled={isSubmitting}>
                  <Send className="h-4 w-4" /> Submit
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit your test?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div>
                      You have answered <strong>{answeredCount} of {questions.length}</strong> questions.
                      {answeredCount < questions.length && (
                        <p className="mt-1 text-orange-500 font-medium">
                          ⚠ {questions.length - answeredCount} question{questions.length - answeredCount > 1 ? "s" : ""} left unanswered.
                        </p>
                      )}
                      <p className="mt-1">This action cannot be undone.</p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Go Back</AlertDialogCancel>
                  <AlertDialogAction onClick={() => doSubmit(false)} disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</> : "Submit Test"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-8">
          {q ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Question <span className="text-foreground font-semibold">{activeQ + 1}</span> of {questions.length}
                </p>
                <div className="flex items-center gap-2">
                  {isAnswered(answers[activeQ]) ? (
                    <Badge variant="secondary" className="text-green-600 bg-green-500/10 border-green-500/20 text-xs">Answered</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-xs">Not answered</Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">{q.marks} marks</Badge>
                </div>
              </div>

              <p className="text-lg font-medium leading-relaxed">{q.text}</p>

              {q.type === "single_choice" && <SingleChoiceAnswer q={q} answer={answers[activeQ]} onChange={setAnswer} />}
              {q.type === "multi_choice" && <MultiChoiceAnswer q={q} answer={answers[activeQ]} onChange={setAnswer} />}
              {q.type === "true_false" && <TrueFalseAnswer answer={answers[activeQ]} onChange={setAnswer} />}
              {q.type === "text" && <TextAnswer answer={answers[activeQ]} onChange={setAnswer} />}
              {q.type === "sequence" && <SequenceAnswer q={q} answer={answers[activeQ]} onChange={setAnswer} />}

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" size="sm" className="gap-2" disabled={activeQ === 0} onClick={() => setActiveQ((i) => i - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button size="sm" className="gap-2" disabled={activeQ === questions.length - 1} onClick={() => setActiveQ((i) => i + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <FileText className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No questions found.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside className="flex w-64 shrink-0 flex-col border-l border-border bg-card overflow-y-auto">
        <div className="p-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Question Palette</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((_: any, idx: number) => {
              const answered = isAnswered(answers[idx]);
              const active = activeQ === idx;
              return (
                <button key={idx} onClick={() => setActiveQ(idx)}
                  className={cn("flex h-8 w-full items-center justify-center rounded text-xs font-medium transition-all border",
                    active ? "bg-primary text-primary-foreground border-primary"
                    : answered ? "bg-green-500/15 text-green-700 border-green-500/30 hover:bg-green-500/25"
                    : "bg-card text-foreground border-border hover:bg-muted")}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm bg-green-500/20 border border-green-500/30 inline-block" /> Answered
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm bg-card border border-border inline-block" /> Not answered
            </span>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Test Info</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Answered</span>
              <span className="font-semibold text-green-600">{answeredCount} / {questions.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Marks</span>
              <span className="font-medium">{test.totalMarks ?? "—"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Neg. Marking</span>
              <span className={cn("font-medium", test.isNegativeMarking && "text-orange-500")}>{test.isNegativeMarking ? "Yes (-1)" : "No"}</span>
            </div>
          </div>
          {test.isNegativeMarking && (
            <div className="flex items-start gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 p-2 mt-2">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-orange-600 leading-relaxed">Wrong answers deduct 1 mark each.</p>
            </div>
          )}
        </div>

        <div className="mt-auto p-4 border-t border-border">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full gap-2" size="sm" disabled={isSubmitting}>
                <Send className="h-4 w-4" /> Submit Test
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit your test?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div>
                    You have answered <strong>{answeredCount} of {questions.length}</strong> questions.
                    {answeredCount < questions.length && (
                      <p className="mt-1 text-orange-500 font-medium">
                        ⚠ {questions.length - answeredCount} question{questions.length - answeredCount > 1 ? "s" : ""} left unanswered.
                      </p>
                    )}
                    <p className="mt-1">This action cannot be undone.</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go Back</AlertDialogCancel>
                <AlertDialogAction onClick={() => doSubmit(false)} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</> : "Submit Test"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>
    </div>
  );
}
