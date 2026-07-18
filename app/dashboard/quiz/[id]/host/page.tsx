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
import { ArrowLeft, Play, SkipForward, Square, Clock, Users, Trophy, Menu } from "lucide-react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
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
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const quiz = data?.quiz;
  const currentQuestionId = quiz?.currentQuestionId;

  // Persist leaderboard: only update when we get fresh data from showing_results.
  // This keeps the last-known rankings visible during in_progress instead of resetting to placeholder.
  type LeaderboardEntry = { studentId: string; totalScore: number; firstName: string | null; lastName: string | null; rollNumber: string | null };
  const [lastLeaderboard, setLastLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (quiz?.leaderboard && quiz.leaderboard.length > 0) {
      setLastLeaderboard(quiz.leaderboard);
    }
  }, [quiz?.leaderboard]);

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
      hostControl({ action: "open" as any, timeToAddSeconds: 15 }); // 'open' might not be perfectly typed locally, but the API will accept it
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
  const isShowingResults = quiz.status === "showing_results";

  const currentQuestion = quiz.questions?.find((q: any) => q.id === quiz.currentQuestionId);
  const currentQuestionIndex = quiz.questions?.findIndex((q: any) => q.id === quiz.currentQuestionId) ?? -1;

  // Calculate remaining time
  let timeRemaining = 0;
  if (isInProgress && currentQuestion && quiz.currentQuestionStartedAt) {
    const startMs = new Date(quiz.currentQuestionStartedAt).getTime();
    const elapsed = Math.floor((now - startMs) / 1000);
    timeRemaining = Math.max(0, currentQuestion.durationSeconds - elapsed);
  }

  const handleAction = (action: any, timeToAddSeconds?: number) => {
    if (action === "end") {
      setShowEndConfirm(true);
      return;
    }
    executeAction(action, timeToAddSeconds);
  };

  const executeAction = (action: any, timeToAddSeconds?: number) => {
    const successMessages: Record<string, string> = {
      open:         "Quiz is now open — students can join!",
      start:        "Question started! Students can now answer.",
      show_results: "Results revealed to all students.",
      next:         "Moving to next question…",
      end:          "Quiz ended successfully.",
      add_time:     `+${timeToAddSeconds ?? 15} seconds added to the timer.`,
    };
    const errorMessages: Record<string, string> = {
      open:         "Failed to open the quiz. Please try again.",
      start:        "Failed to start the question. Please try again.",
      show_results: "Failed to reveal results. Please try again.",
      next:         "Failed to move to next question. Please try again.",
      end:          "Failed to end the quiz. Please try again.",
      add_time:     "Failed to add time. Please try again.",
    };

    hostControl(
      { action, timeToAddSeconds: timeToAddSeconds ?? 15 },
      {
        onSuccess: () => {
          toast.success(successMessages[action] ?? "Done!");
          if (action === "end") setShowEndConfirm(false);
        },
        onError: (err) => {
          toast.error(errorMessages[action] ?? err.message ?? "Something went wrong.");
          if (action === "end") setShowEndConfirm(false);
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
      const sumVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0) || 0;

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-6 md:mt-8 w-full max-w-4xl mx-auto">
          {options.map((opt: any, i: number) => {
            const isCorrect = 
              currentQuestion.type === "single_choice" 
                ? ans === opt.id 
                : Array.isArray(ans) && ans.includes(opt.id);
            
              const optionVotes = voteCounts[String(opt.id)] || 0;
              const percentage = sumVotes > 0 ? Math.round((optionVotes / sumVotes) * 100) : 0;

              return (
                <div 
                  key={opt.id} 
                  className={cn(
                    "relative overflow-hidden flex items-center justify-between p-4 md:p-6 rounded-xl border-2 shadow-sm transition-colors",
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
                  
                  <div className="flex items-center gap-3 md:gap-4 relative z-10 w-full overflow-hidden mr-4">
                    <div className={cn(
                      "flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full text-base md:text-lg font-bold",
                      isCorrect ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {labels[i]}
                    </div>
                    <span className={cn("text-lg md:text-xl font-medium truncate", isCorrect ? "text-foreground" : "text-foreground")}>
                      {opt.text}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-3 relative z-10 shrink-0">
                    <span className="font-bold text-base md:text-lg text-muted-foreground">{percentage}%</span>
                    {isCorrect && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600 uppercase tracking-widest text-[10px] hidden sm:inline-flex">
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
      const sumVotes = trueVotes + falseVotes;
      const truePct = sumVotes > 0 ? Math.round((trueVotes / sumVotes) * 100) : 0;
      const falsePct = sumVotes > 0 ? Math.round((falseVotes / sumVotes) * 100) : 0;


      return (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-6 md:mt-8 w-full max-w-2xl mx-auto">
          <div className={cn(
            "flex-1 flex flex-col items-center justify-center p-6 md:p-8 rounded-xl border-2 shadow-sm relative overflow-hidden transition-colors",
            ans === true ? "border-green-500 bg-green-500/10 text-green-700" : "border-border bg-card text-primary"
          )}>
            <div 
              className="absolute left-0 bottom-0 right-0 bg-primary/10 transition-all duration-500 ease-in-out" 
              style={{ height: `${truePct}%` }}
            />
            {ans === true && (
              <Badge variant="default" className="absolute top-4 right-4 bg-green-500 hover:bg-green-600 uppercase tracking-widest text-[10px] z-10 hidden sm:inline-flex">
                Correct
              </Badge>
            )}
            <span className={cn("text-2xl md:text-3xl font-bold z-10", ans === true ? "text-green-600" : "")}>True</span>
            <span className="font-bold text-base md:text-lg text-muted-foreground mt-2 z-10">{truePct}%</span>
          </div>

          <div className={cn(
            "flex-1 flex flex-col items-center justify-center p-6 md:p-8 rounded-xl border-2 shadow-sm relative overflow-hidden transition-colors",
            ans === false ? "border-green-500 bg-green-500/10 text-green-700" : "border-border bg-card text-destructive"
          )}>
            <div 
              className="absolute left-0 bottom-0 right-0 bg-primary/10 transition-all duration-500 ease-in-out" 
              style={{ height: `${falsePct}%` }}
            />
            {ans === false && (
              <Badge variant="default" className="absolute top-4 right-4 bg-green-500 hover:bg-green-600 uppercase tracking-widest text-[10px] z-10 hidden sm:inline-flex">
                Correct
              </Badge>
            )}
            <span className={cn("text-2xl md:text-3xl font-bold z-10", ans === false ? "text-green-600" : "")}>False</span>
            <span className="font-bold text-base md:text-lg text-muted-foreground mt-2 z-10">{falsePct}%</span>
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
            const isCorrect = correctPos !== null && correctPos > 0;
            return (
              <div 
                key={item.id} 
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-4 text-left shadow-sm",
                  isCorrect 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  isCorrect ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {isCorrect ? correctPos : ""}
                </div>
                <span className="text-lg font-medium text-foreground">{item.text}</span>
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

  const LeaderboardPanel = (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="font-bold text-sm text-foreground">Leaderboard</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {lastLeaderboard.length} students
        </Badge>
      </div>

      {lastLeaderboard.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Trophy className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground text-sm">Results will appear here</p>
          <p className="text-xs text-muted-foreground">Click &apos;Show Results&apos; after the first question</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {isInProgress && (
            <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-b border-border font-medium">
              Previous question rankings
            </div>
          )}
          <ul className="divide-y divide-border">
            {lastLeaderboard.map((entry, index) => {
              const rank = index + 1;
              const name = [entry.firstName, entry.lastName].filter(Boolean).join(" ") || "Unknown Student";
              return (
                <li key={entry.studentId} className="flex items-center gap-3 px-3 py-2.5">
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    rank === 1 ? "bg-amber-500 text-white" :
                    rank === 2 ? "bg-slate-400 text-white" :
                    rank === 3 ? "bg-orange-700 text-white" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{name}</p>
                    {entry.rollNumber && (
                      <span className="inline-block font-mono text-xs bg-muted rounded px-2 py-0.5 mt-0.5 max-w-full truncate">
                        {entry.rollNumber}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">{entry.totalScore}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* ── TOP BAR ── */}
      <header className="flex min-h-16 shrink-0 flex-col md:flex-row md:items-center justify-between border-b border-border bg-card px-4 md:px-6 py-2 md:py-0 z-10 gap-2 md:gap-0">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-base md:text-lg font-bold text-foreground leading-tight line-clamp-1">{quiz.title}</h1>
              <Badge variant="secondary" className="mt-0.5 text-[10px] uppercase">
                {quiz.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
          <div className="flex lg:hidden shrink-0">
            {(isInProgress || isShowingResults) && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 shrink-0">
                    <Trophy className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only">Leaderboard</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] p-0 flex flex-col">
                  {LeaderboardPanel}
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between w-full md:w-auto gap-3 flex-wrap">
          {isInProgress && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 md:px-4 py-1.5 flex items-center gap-2">
              <span className="text-[10px] md:text-xs uppercase font-bold text-primary tracking-wider hidden sm:inline">Join Code:</span>
              <span className="font-mono font-bold text-sm md:text-lg text-foreground tracking-widest">{quiz.joinCode}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto md:ml-0">
            {isInProgress && (
              <div className="flex items-center gap-1.5 md:gap-2 rounded-full bg-primary/10 px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium text-primary border border-primary/20">
                <span className="font-bold">{totalVoted} / {liveStudentCount}</span> <span className="hidden sm:inline">Voted</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 md:gap-2 rounded-full bg-muted px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium text-foreground">
              <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
              <span className="font-bold">{liveStudentCount}</span> <span className="hidden sm:inline">Students</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex flex-1 overflow-hidden">

        {/* LEFT: Leaderboard Sidebar — only during active quiz (Desktop) */}
        {(isInProgress || isShowingResults) && (
          <aside className="hidden lg:flex w-72 shrink-0 border-r border-border bg-card flex-col h-full overflow-hidden">
            {LeaderboardPanel}
          </aside>
        )}

        {/* RIGHT: Existing main content */}
        <div className="flex-1 flex flex-col relative overflow-y-auto">
          {/* HUGE JOIN CODE BANNER (Only before starting) */}
          {(isDraft || isWaiting) && !isInProgress && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <Card className="w-full max-w-4xl border-4 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden">
                <div className="bg-primary px-4 py-3 text-center text-primary-foreground text-xs md:text-sm font-bold tracking-widest uppercase">
                  Join Code
                </div>
                <CardContent className="flex flex-col items-center justify-center p-8 md:p-16">
                  <p className="text-muted-foreground mb-6 font-medium text-lg md:text-2xl text-center">
                    Go to <span className="font-bold text-foreground">eduquiz.app/join</span> and enter:
                  </p>
                  <div className="rounded-2xl bg-background border-2 border-primary/30 px-8 md:px-16 py-6 md:py-8 shadow-inner w-full sm:w-auto text-center">
                    <span className="text-5xl md:text-8xl font-black tracking-[0.1em] md:tracking-[0.25em] text-foreground font-mono">
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
          {(isInProgress || isShowingResults) && currentQuestion && (
            <div className="flex-1 flex flex-col p-8 overflow-y-auto">
              <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
                
                <div className="flex items-center justify-between mb-8">
                  <Badge variant="outline" className="text-sm px-3 py-1 font-semibold uppercase tracking-wider text-muted-foreground border-border">
                    Question {currentQuestionIndex + 1} of {quiz.questions?.length ?? 0}
                  </Badge>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 ml-2">
                    {currentQuestion.type === "single_choice" && "Single Correct"}
                    {currentQuestion.type === "multi_choice" && "Multiple Correct"}
                    {currentQuestion.type === "true_false" && "True/False"}
                    {currentQuestion.type === "sequence" && "Order Items"}
                    {currentQuestion.type === "text" && "Text Answer"}
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
                  <h3 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight max-w-4xl">
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
              <Card className="w-full max-w-2xl border-2 border-border shadow-2xl text-center p-8 md:p-16">
                <div className="mx-auto mb-6 md:mb-8 flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-primary/10">
                  <Square className="h-10 w-10 md:h-12 md:w-12 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">Quiz Ended</h2>
                <p className="mt-3 md:mt-4 text-lg md:text-xl text-muted-foreground">The quiz has been successfully completed.</p>
                <div className="mt-8 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 w-full">
                  <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base md:text-lg font-bold w-full sm:w-auto">
                    <Link href="/dashboard">Back to Dashboard</Link>
                  </Button>
                  <Button asChild size="lg" className="h-14 px-8 text-base md:text-lg font-bold gap-2 shadow-lg w-full sm:w-auto">
                    <Link href={`/quiz/${quiz.id}/results`}>
                      <Trophy className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                      View Final Results
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* ── BOTTOM HOST CONTROLS (Only when in progress or showing results) ── */}
      {(isInProgress || isShowingResults) && (
        <footer className="shrink-0 border-t border-border bg-card p-3 sm:p-4 z-10 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 sm:gap-4">
            <Button 
              size="lg" 
              variant="outline" 
              className="h-12 sm:h-14 px-4 sm:px-8 font-bold gap-2 text-muted-foreground hover:text-foreground flex-1 sm:flex-none text-xs sm:text-base"
              disabled={isControlling || isShowingResults}
              onClick={() => handleAction("add_time")}
            >
              <Clock className="h-4 sm:h-5 w-4 sm:w-5 shrink-0" />
              <span className="hidden sm:inline">+15 Seconds</span>
              <span className="sm:hidden">+15s</span>
            </Button>

            {isInProgress ? (
              <Button 
                size="lg" 
                className="h-12 sm:h-14 px-6 sm:px-12 text-sm sm:text-lg font-bold shadow-lg gap-2 flex-1 sm:flex-none"
                disabled={isControlling}
                onClick={() => handleAction("show_results")}
              >
                <SkipForward className="h-4 sm:h-5 w-4 sm:w-5 shrink-0" />
                <span className="truncate">Show Results</span>
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="h-12 sm:h-14 px-6 sm:px-12 text-sm sm:text-lg font-bold shadow-lg gap-2 flex-1 sm:flex-none"
                disabled={isControlling}
                onClick={() => handleAction("next")}
              >
                <SkipForward className="h-4 sm:h-5 w-4 sm:w-5 shrink-0" />
                <span className="truncate">{currentQuestionIndex + 1 === quiz.questions?.length ? "Finish Quiz" : "Next Question"}</span>
              </Button>
            )}

            <Button 
              size="lg" 
              variant="destructive" 
              className="h-12 sm:h-14 px-4 sm:px-8 font-bold shadow-lg gap-2 ml-auto text-xs sm:text-base flex-[0.5] sm:flex-none"
              disabled={isControlling}
              onClick={() => handleAction("end")}
            >
              <Square className="h-4 sm:h-5 w-4 sm:w-5 shrink-0" />
              <span className="hidden sm:inline">End Early</span>
              <span className="sm:hidden">End</span>
            </Button>
          </div>
        </footer>
      )}

      <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Quiz Early?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end the quiz now? This will immediately stop the quiz for all students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => executeAction("end")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
