"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetQuiz } from "@/hooks/tanstackQuery/quiz/use-get-quiz";
import { useSubmitAnswer } from "@/hooks/tanstackQuery/quiz-response/use-submit-answer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function StudentQuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetQuiz(params.id);
  const { mutate: submitAnswer, isPending: isSubmitting } = useSubmitAnswer(params.id);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [now, setNow] = useState(new Date().getTime());
  const [liveStudentCount, setLiveStudentCount] = useState(0);

  const quiz = data?.quiz;

  // Local state for answering
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [sequenceOrder, setSequenceOrder] = useState<string[]>([]);
  const [submittedStatus, setSubmittedStatus] = useState<"correct" | "incorrect" | "submitted" | null>(null);
  
  // Track the current question ID so we can reset state when it changes
  const [trackedQuestionId, setTrackedQuestionId] = useState<number | null>(null);

  useEffect(() => {
    if (!quiz) return;
    
    // Connect to websocket
    const newSocket = io(window.location.origin, {
      path: "/api/socket/io",
    });

    newSocket.on("connect", () => {
      newSocket.emit("join_quiz", { quizId: quiz.id });
    });

    newSocket.on("quiz_state_updated", () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", params.id] });
    });

    newSocket.on("live_count_updated", (data: any) => {
      // Subtract 1 if the host is in the room, but the student client doesn't explicitly know.
      // Actually, since the host is in the room, the total count includes the host.
      // We will subtract 1 to represent just the students.
      setLiveStudentCount(Math.max(0, data.count - 1));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [quiz?.id, params.id, queryClient]);

  // Sync initial student count
  useEffect(() => {
    if (quiz?.studentCount !== undefined) {
      setLiveStudentCount(quiz.studentCount);
    }
  }, [quiz?.studentCount]);

  // Reset answer state when the active question changes
  useEffect(() => {
    if (quiz?.currentQuestionId && quiz.currentQuestionId !== trackedQuestionId) {
      setTrackedQuestionId(quiz.currentQuestionId);
      setSelectedAnswer(null);
      setSequenceOrder([]);
      setSubmittedStatus(null);
    }
  }, [quiz?.currentQuestionId, trackedQuestionId]);

  // Timer interval
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-center">
        <h2 className="text-xl font-bold text-foreground">Quiz not found</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/join">Back to Join</Link>
        </Button>
      </div>
    );
  }

  const isDraft = quiz.status === "draft";
  const isWaiting = quiz.status === "waiting";
  const isInProgress = quiz.status === "in_progress";
  const isCompleted = quiz.status === "completed";

  const currentQuestion = quiz.questions?.length > 0 ? quiz.questions[0] : null;

  // Calculate remaining time
  let timeRemaining = 0;
  if (isInProgress && currentQuestion && quiz.currentQuestionStartedAt) {
    const startMs = new Date(quiz.currentQuestionStartedAt).getTime();
    const elapsed = Math.floor((now - startMs) / 1000);
    timeRemaining = Math.max(0, currentQuestion.durationSeconds - elapsed);
  }

  const isTimeUp = isInProgress && currentQuestion && timeRemaining <= 0;

  const handleSubmit = (finalAnswer?: any) => {
    if (!currentQuestion || submittedStatus) return;
    
    let answerToSubmit = finalAnswer !== undefined ? finalAnswer : selectedAnswer;
    
    if (currentQuestion.type === "sequence") {
      answerToSubmit = sequenceOrder;
    }

    if (answerToSubmit === null || answerToSubmit === undefined || answerToSubmit === "") {
      toast.error("Please provide an answer.");
      return;
    }

    if (currentQuestion.type === "multi_choice" && (!Array.isArray(answerToSubmit) || answerToSubmit.length === 0)) {
      toast.error("Please select at least one option.");
      return;
    }

    if (currentQuestion.type === "sequence" && answerToSubmit.length < currentQuestion.config.items.length) {
      toast.error("Please order all items.");
      return;
    }

    submitAnswer(
      {
        quizId: quiz.id,
        questionId: currentQuestion.id,
        type: currentQuestion.type as any,
        answer: answerToSubmit,
      },
      {
        onSuccess: (data) => {
          if (data.isCorrect === true) setSubmittedStatus("correct");
          else if (data.isCorrect === false) setSubmittedStatus("incorrect");
          else setSubmittedStatus("submitted"); // if graded manually or later
          toast.success("Answer submitted!");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to submit answer");
        },
      }
    );
  };

  const handleSequenceClick = (itemId: string) => {
    if (submittedStatus || isTimeUp) return;
    if (sequenceOrder.includes(itemId)) {
      setSequenceOrder(prev => prev.filter(id => id !== itemId));
    } else {
      setSequenceOrder(prev => [...prev, itemId]);
    }
  };

  const renderQuestionUI = () => {
    if (!currentQuestion) return null;

    const disabled = submittedStatus !== null || isTimeUp;

    if (currentQuestion.type === "single_choice") {
      const options = currentQuestion.config?.options ?? [];
      const labels = "ABCDEFGHIJ".split("");
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-4xl mx-auto">
          {options.map((opt: any, i: number) => {
            const isSelected = selectedAnswer === opt.id;
            return (
              <button
                key={opt.id}
                disabled={disabled}
                onClick={() => {
                  setSelectedAnswer(opt.id);
                }}
                className={cn(
                  "flex items-center gap-4 p-6 rounded-xl border-4 text-left transition-all active:scale-95 shadow-sm",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card hover:border-primary/40",
                  disabled && !isSelected && "opacity-50 cursor-not-allowed",
                  disabled && isSelected && "opacity-100 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {labels[i]}
                </div>
                <span className="text-xl font-medium text-foreground">{opt.text}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (currentQuestion.type === "multi_choice") {
      const options = currentQuestion.config?.options ?? [];
      const labels = "ABCDEFGHIJ".split("");
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-4xl mx-auto">
          {options.map((opt: any, i: number) => {
            const isSelected = Array.isArray(selectedAnswer) && selectedAnswer.includes(opt.id);
            return (
              <button
                key={opt.id}
                disabled={disabled}
                onClick={() => {
                  const current = Array.isArray(selectedAnswer) ? [...selectedAnswer] : [];
                  if (isSelected) {
                    setSelectedAnswer(current.filter(id => id !== opt.id));
                  } else {
                    setSelectedAnswer([...current, opt.id]);
                  }
                }}
                className={cn(
                  "flex items-center gap-4 p-6 rounded-xl border-4 text-left transition-all active:scale-95 shadow-sm",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card hover:border-primary/40",
                  disabled && !isSelected && "opacity-50 cursor-not-allowed",
                  disabled && isSelected && "opacity-100 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {labels[i]}
                </div>
                <span className="text-xl font-medium text-foreground">{opt.text}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (currentQuestion.type === "true_false") {
      return (
        <div className="flex flex-col sm:flex-row gap-6 mt-8 w-full max-w-2xl mx-auto">
          <button
            disabled={disabled}
            onClick={() => setSelectedAnswer(true)}
            className={cn(
              "flex-1 flex items-center justify-center p-8 rounded-xl border-4 shadow-sm transition-all active:scale-95",
              selectedAnswer === true ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
              disabled && selectedAnswer !== true && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className={cn("text-3xl font-bold", selectedAnswer === true ? "text-primary" : "text-foreground")}>True</span>
          </button>
          <button
            disabled={disabled}
            onClick={() => setSelectedAnswer(false)}
            className={cn(
              "flex-1 flex items-center justify-center p-8 rounded-xl border-4 shadow-sm transition-all active:scale-95",
              selectedAnswer === false ? "border-destructive bg-destructive/10" : "border-border bg-card hover:border-destructive/40",
              disabled && selectedAnswer !== false && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className={cn("text-3xl font-bold", selectedAnswer === false ? "text-destructive" : "text-foreground")}>False</span>
          </button>
        </div>
      );
    }

    if (currentQuestion.type === "sequence") {
      const items = currentQuestion.config?.items ?? [];
      return (
        <div className="flex flex-col gap-3 mt-8 w-full max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground mb-2">Tap the items in the correct order:</p>
          {items.map((item: any) => {
            const indexInOrder = sequenceOrder.indexOf(item.id);
            const isSelected = indexInOrder !== -1;
            return (
              <button
                key={item.id}
                disabled={disabled}
                onClick={() => handleSequenceClick(item.id)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-4 text-left transition-all active:scale-95 shadow-sm",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card hover:border-primary/40",
                  disabled && !isSelected && "opacity-50 cursor-not-allowed",
                  disabled && isSelected && "opacity-100 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {isSelected ? indexInOrder + 1 : ""}
                </div>
                <span className="text-lg font-medium text-foreground">{item.text}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (currentQuestion.type === "text") {
      return (
        <div className="mt-8 text-center flex flex-col items-center gap-6 w-full max-w-md mx-auto">
          <Input 
            value={selectedAnswer || ""}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer here..."
            className="h-16 text-center text-xl shadow-sm border-2 focus-visible:ring-primary/20"
            autoFocus
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden relative">
      {/* ── TOP BAR ── */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6 z-10">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{quiz.title}</h1>
            <Badge variant="secondary" className="mt-0.5 text-[10px] uppercase">
              {isWaiting || isDraft ? "Waiting to start" : quiz.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground">
            <Users className="h-4 w-4 text-muted-foreground" />
            {liveStudentCount} {liveStudentCount === 1 ? "Student" : "Students"}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex flex-1 flex-col relative">
        
        {/* WAITING SCREEN */}
        {(isDraft || isWaiting) && !isInProgress && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-muted/30">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 animate-pulse">
              <Clock className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground text-center">You're in!</h2>
            <p className="mt-4 text-xl text-muted-foreground text-center max-w-md">
              Waiting for the educator to start the quiz. Get ready!
            </p>
          </div>
        )}

        {/* ACTIVE QUESTION PANEL */}
        {isInProgress && currentQuestion && (
          <div className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
              
              <div className="flex items-center justify-end mb-8">
                {/* TIMER BUBBLE */}
                <div className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-full border-2 font-mono text-2xl font-bold shadow-sm transition-colors",
                  timeRemaining <= 5 
                    ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse" 
                    : timeRemaining <= 15
                    ? "border-orange-500/50 bg-orange-500/10 text-orange-600"
                    : "border-primary/30 bg-primary/5 text-primary"
                )}>
                  <Clock className="h-6 w-6" />
                  {timeRemaining}s
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-start text-center pb-24">
                <h3 className="text-3xl md:text-4xl font-bold text-foreground leading-tight max-w-4xl">
                  {currentQuestion.text}
                </h3>
                
                {renderQuestionUI()}
              </div>
            </div>
          </div>
        )}

        {/* COMPLETED STATE */}
        {isCompleted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-muted/30">
            <Card className="w-full max-w-md border-2 border-border shadow-2xl text-center p-12">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Quiz Ended</h2>
              <p className="mt-4 text-lg text-muted-foreground">The host has ended the session.</p>
              <Button asChild className="mt-8 w-full" variant="outline">
                <Link href="/">Back Home</Link>
              </Button>
            </Card>
          </div>
        )}

        {/* ── FEEDBACK OVERLAY (Correct/Incorrect/Time Up) ── */}
        {isInProgress && currentQuestion && (submittedStatus || isTimeUp) && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center justify-center animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className={cn(
              "px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 border-2 font-bold text-xl",
              (submittedStatus === "correct" && isTimeUp) && "bg-green-100 border-green-500 text-green-700",
              (submittedStatus === "incorrect" && isTimeUp) && "bg-destructive/10 border-destructive text-destructive",
              (submittedStatus && !isTimeUp) && "bg-primary/10 border-primary text-primary",
              (!submittedStatus && isTimeUp) && "bg-muted border-border text-muted-foreground"
            )}>
              {(submittedStatus === "correct" && isTimeUp) && <CheckCircle2 className="h-8 w-8" />}
              {(submittedStatus === "incorrect" && isTimeUp) && <XCircle className="h-8 w-8" />}
              {(submittedStatus && !isTimeUp) && <CheckCircle2 className="h-8 w-8" />}
              {(!submittedStatus && isTimeUp) && <Clock className="h-8 w-8" />}
              
              {(submittedStatus === "correct" && isTimeUp) && "Correct!"}
              {(submittedStatus === "incorrect" && isTimeUp) && "Incorrect!"}
              {(submittedStatus && !isTimeUp) && "Answer recorded! Waiting for time..."}
              {(!submittedStatus && isTimeUp) && "Time's up!"}
            </div>
          </div>
        )}

      </main>

      {/* ── BOTTOM STUDENT CONTROLS (Only when in progress & not submitted) ── */}
      {isInProgress && !submittedStatus && !isTimeUp && (
        <footer className="shrink-0 border-t border-border bg-card p-4 z-10 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)] fixed bottom-0 left-0 right-0">
          <div className="mx-auto flex max-w-5xl items-center justify-end">
            <Button 
              size="lg" 
              className="h-14 px-12 text-lg font-bold shadow-lg gap-2 w-full md:w-auto"
              disabled={isSubmitting}
              onClick={() => handleSubmit()}
            >
              {isSubmitting ? "Submitting..." : "Submit Answer"}
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
