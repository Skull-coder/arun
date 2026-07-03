"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetQuiz } from "@/hooks/tanstackQuery/quiz/use-get-quiz";
import { useHostControl } from "@/hooks/tanstackQuery/quiz/use-host-control";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Play, SkipForward, Square, Clock, Users } from "lucide-react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function HostQuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetQuiz(params.id);
  const { mutate: hostControl, isPending: isControlling } = useHostControl(params.id);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [now, setNow] = useState(new Date().getTime());
  const [liveStudentCount, setLiveStudentCount] = useState(0);

  // Voting state
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [totalVoted, setTotalVoted] = useState(0);
  const [trackedQuestionId, setTrackedQuestionId] = useState<number | null>(null);

  const quiz = data?.quiz;
  const currentQuestionId = quiz?.currentQuestionId;

  // Reset votes when question changes
  useEffect(() => {
    if (currentQuestionId && currentQuestionId !== trackedQuestionId) {
      setVoteCounts({});
      setTotalVoted(0);
      setTrackedQuestionId(currentQuestionId);
    }
  }, [currentQuestionId, trackedQuestionId]);

  useEffect(() => {
    if (!quiz) return;
    
    // Connect to websocket
    const newSocket = io(window.location.origin, {
      path: "/api/socket/io",
    });

    newSocket.on("connect", () => {
      newSocket.emit("join_host", { quizId: quiz.id });
    });

    newSocket.on("quiz_state_updated", () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", params.id] });
    });

    newSocket.on("live_count_updated", (data: any) => {
      setLiveStudentCount(Math.max(0, data.count - 1));
    });

    newSocket.on("answer_submitted", (data: { questionId: number, answer: any }) => {
      // Only process if it matches the current question
      setVoteCounts((prev) => {
        const newCounts = { ...prev };
        
        // Handle array of answers (e.g., multi_choice or sequence)
        if (Array.isArray(data.answer)) {
          data.answer.forEach((ans) => {
            const key = String(ans);
            newCounts[key] = (newCounts[key] || 0) + 1;
          });
        } else {
          // Handle single answer (single_choice, true_false, text)
          const key = String(data.answer);
          newCounts[key] = (newCounts[key] || 0) + 1;
        }
        
        return newCounts;
      });
      setTotalVoted((prev) => prev + 1);
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

  // Timer interval
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Automatically open the quiz (transition from draft to waiting) when the host lands here
  useEffect(() => {
    if (quiz && quiz.status === "draft") {
      hostControl({ action: "open" as any }); // 'open' might not be perfectly typed locally, but the API will accept it
    }
  }, [quiz?.status]);

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
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const isDraft = quiz.status === "draft";
  const isWaiting = quiz.status === "waiting";
  const isInProgress = quiz.status === "in_progress";
  const isCompleted = quiz.status === "completed";

  const currentQuestion = quiz.questions?.find((q: any) => q.id === quiz.currentQuestionId);
  const currentQuestionIndex = quiz.questions?.findIndex((q: any) => q.id === quiz.currentQuestionId) ?? -1;

  // Calculate remaining time
  let timeRemaining = 0;
  if (isInProgress && currentQuestion && quiz.currentQuestionStartedAt) {
    const startMs = new Date(quiz.currentQuestionStartedAt).getTime();
    const elapsed = Math.floor((now - startMs) / 1000);
    timeRemaining = Math.max(0, currentQuestion.durationSeconds - elapsed);
  }

  const handleAction = (action: "start" | "next" | "end" | "add_time", timeToAddSeconds: number ) => {
    if (action === "end") {
      if (!window.confirm("Are you sure you want to end the quiz early?")) return;
    }
    hostControl(
      { action, timeToAddSeconds },
      {
        onSuccess: () => {
          toast.success(`Action "${action}" successful`);
        },
        onError: (err) => {
          toast.error(err.message || `Failed to ${action} quiz`);
        },
      }
    );
  };

  const renderOptions = () => {
    if (!currentQuestion) return null;
    
    // Correct answer is provided because the host is the creator
    const ans = currentQuestion.correctAnswer;

    if (currentQuestion.type === "single_choice" || currentQuestion.type === "multi_choice") {
      const options = currentQuestion.config?.options ?? [];
      const labels = "ABCDEFGHIJ".split("");
      return (
        <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-4xl mx-auto">
          {options.map((opt: any, i: number) => {
            const isCorrect = 
              currentQuestion.type === "single_choice" 
                ? ans === opt.id 
                : Array.isArray(ans) && ans.includes(opt.id);
            
              const optionVotes = voteCounts[String(opt.id)] || 0;
              const percentage = totalVoted > 0 ? Math.round((optionVotes / totalVoted) * 100) : 0;

              return (
                <div 
                  key={opt.id} 
                  className={cn(
                    "relative overflow-hidden flex items-center justify-between p-6 rounded-xl border-2 shadow-sm transition-colors",
                    isCorrect 
                      ? "border-green-500 bg-green-500/10 text-green-700" 
                      : "border-border bg-card"
                  )}
                >
                  {/* Progress Bar Background */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-500 ease-in-out" 
                    style={{ width: `${percentage}%` }}
                  />
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                      isCorrect ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {labels[i]}
                    </div>
                    <span className={cn("text-xl font-medium", isCorrect ? "text-foreground" : "text-foreground")}>
                      {opt.text}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <span className="font-bold text-lg text-muted-foreground">{percentage}%</span>
                    {isCorrect && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600 uppercase tracking-widest text-[10px]">
                        Correct
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      );
    }
    
    if (currentQuestion.type === "true_false") {
      const trueVotes = voteCounts["true"] || 0;
      const falseVotes = voteCounts["false"] || 0;
      const truePct = totalVoted > 0 ? Math.round((trueVotes / totalVoted) * 100) : 0;
      const falsePct = totalVoted > 0 ? Math.round((falseVotes / totalVoted) * 100) : 0;

      return (
        <div className="flex gap-6 mt-8 w-full max-w-2xl mx-auto">
          <div className={cn(
            "flex-1 flex flex-col items-center justify-center p-8 rounded-xl border-2 shadow-sm relative overflow-hidden transition-colors",
            ans === true ? "border-green-500 bg-green-500/10 text-green-700" : "border-border bg-card text-primary"
          )}>
            <div 
              className="absolute left-0 bottom-0 right-0 bg-primary/10 transition-all duration-500 ease-in-out" 
              style={{ height: `${truePct}%` }}
            />
            {ans === true && (
              <Badge variant="default" className="absolute top-4 right-4 bg-green-500 hover:bg-green-600 uppercase tracking-widest text-[10px] z-10">
                Correct
              </Badge>
            )}
            <span className={cn("text-3xl font-bold z-10", ans === true ? "text-green-600" : "")}>True</span>
            <span className="font-bold text-lg text-muted-foreground mt-2 z-10">{truePct}%</span>
          </div>

          <div className={cn(
            "flex-1 flex flex-col items-center justify-center p-8 rounded-xl border-2 shadow-sm relative overflow-hidden transition-colors",
            ans === false ? "border-green-500 bg-green-500/10 text-green-700" : "border-border bg-card text-destructive"
          )}>
            <div 
              className="absolute left-0 bottom-0 right-0 bg-primary/10 transition-all duration-500 ease-in-out" 
              style={{ height: `${falsePct}%` }}
            />
            {ans === false && (
              <Badge variant="default" className="absolute top-4 right-4 bg-green-500 hover:bg-green-600 uppercase tracking-widest text-[10px] z-10">
                Correct
              </Badge>
            )}
            <span className={cn("text-3xl font-bold z-10", ans === false ? "text-green-600" : "")}>False</span>
            <span className="font-bold text-lg text-muted-foreground mt-2 z-10">{falsePct}%</span>
          </div>
        </div>
      );
    }

    if (currentQuestion.type === "sequence") {
      const items = currentQuestion.config?.items ?? [];
      // To show the correct sequence, we can display the correct order number
      // ans is an array of ids in the correct order.
      return (
        <div className="flex flex-col gap-3 mt-8 w-full max-w-2xl mx-auto">
          {items.map((item: any, i: number) => {
            const correctPos = Array.isArray(ans) ? ans.indexOf(item.id) + 1 : null;
            return (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-card shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                    {i + 1}
                  </div>
                  <span className="text-lg font-medium text-foreground">{item.text}</span>
                </div>
                {correctPos !== null && correctPos > 0 && (
                  <Badge variant="outline" className="border-green-500 text-green-600 bg-green-500/10">
                    Correct position: {correctPos}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (currentQuestion.type === "text") {
      return (
        <div className="mt-8 text-center flex flex-col items-center gap-2">
          <p className="text-muted-foreground text-lg">
            Students will type their answer...
          </p>
          {ans && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-green-500 bg-green-500/10 text-green-700">
              <span className="text-sm font-bold uppercase tracking-wider">Correct Answer:</span>
              <span className="text-lg font-mono font-bold bg-background px-2 py-0.5 rounded">{
                Array.isArray(ans) ? ans.join(" OR ") : ans
              }</span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* ── TOP BAR ── */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{quiz.title}</h1>
            <Badge variant="secondary" className="mt-0.5 text-[10px] uppercase">
              {quiz.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
        
        {isInProgress && (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-1.5 flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-primary tracking-wider">Join Code:</span>
              <span className="font-mono font-bold text-lg text-foreground tracking-widest">{quiz.joinCode}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {isInProgress && (
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary border border-primary/20">
              <span className="font-bold">{totalVoted} / {liveStudentCount}</span> Voted
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground">
            <Users className="h-4 w-4 text-muted-foreground" />
            {liveStudentCount} {liveStudentCount === 1 ? "Student" : "Students"}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex flex-1 flex-col relative">
        
        {/* HUGE JOIN CODE BANNER (Only before starting) */}
        {(isDraft || isWaiting) && !isInProgress && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <Card className="w-full max-w-4xl border-4 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden">
              <div className="bg-primary px-4 py-3 text-center text-primary-foreground text-sm font-bold tracking-widest uppercase">
                Join Code
              </div>
              <CardContent className="flex flex-col items-center justify-center p-16">
                <p className="text-muted-foreground mb-6 font-medium text-2xl">
                  Go to <span className="font-bold text-foreground">eduquiz.app/join</span> and enter:
                </p>
                <div className="rounded-2xl bg-background border-2 border-primary/30 px-16 py-8 shadow-inner">
                  <span className="text-8xl font-black tracking-[0.25em] text-foreground font-mono">
                    {quiz.joinCode}
                  </span>
                </div>
              </CardContent>
            </Card>
            <div className="mt-12">
              <Button 
                size="lg" 
                className="h-20 px-16 rounded-2xl text-2xl font-bold shadow-xl gap-4"
                disabled={isControlling}
                onClick={() => handleAction("start")}
              >
                <Play className="h-8 w-8" />
                Start Quiz
              </Button>
            </div>
          </div>
        )}

        {/* ACTIVE QUESTION PANEL (Full Screen) */}
        {isInProgress && currentQuestion && (
          <div className="flex-1 flex flex-col p-8 overflow-y-auto">
            <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
              
              <div className="flex items-center justify-between mb-8">
                <Badge variant="outline" className="text-sm px-3 py-1 font-semibold uppercase tracking-wider text-muted-foreground border-border">
                  Question {currentQuestionIndex + 1} of {quiz.questions?.length ?? 0}
                </Badge>
                
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

              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <h3 className="text-4xl md:text-5xl font-bold text-foreground leading-tight max-w-4xl">
                  {currentQuestion.text}
                </h3>
                
                {renderOptions()}
              </div>
            </div>
          </div>
        )}

        {/* COMPLETED STATE */}
        {isCompleted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <Card className="w-full max-w-2xl border-2 border-border shadow-2xl text-center p-16">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <Square className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-4xl font-bold text-foreground">Quiz Ended</h2>
              <p className="mt-4 text-xl text-muted-foreground">The quiz has been successfully completed.</p>
              <Button asChild size="lg" className="mt-12 h-14 px-8 text-lg font-bold">
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </Card>
          </div>
        )}
      </main>

      {/* ── BOTTOM HOST CONTROLS (Only when in progress) ── */}
      {isInProgress && (
        <footer className="shrink-0 border-t border-border bg-card p-4 z-10 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)]">
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-4">
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 font-bold gap-2 text-muted-foreground hover:text-foreground"
              disabled={isControlling}
              onClick={() => handleAction("add_time")}
            >
              <Clock className="h-5 w-5" />
              +15 Seconds
            </Button>

            <Button 
              size="lg" 
              className="h-14 px-12 text-lg font-bold shadow-lg gap-2"
              disabled={isControlling}
              onClick={() => handleAction("next")}
            >
              <SkipForward className="h-5 w-5" />
              {currentQuestionIndex + 1 === quiz.questions?.length ? "Finish Quiz" : "Next Question"}
            </Button>

            <Button 
              size="lg" 
              variant="destructive" 
              className="h-14 px-8 font-bold shadow-lg gap-2 ml-auto"
              disabled={isControlling}
              onClick={() => handleAction("end")}
            >
              <Square className="h-5 w-5" />
              End Early
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
