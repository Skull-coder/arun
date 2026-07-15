"use client";

import { useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetQuizResults } from "@/hooks/tanstackQuery/quiz/use-get-quiz-results";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trophy, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuizResultsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { data, isLoading, error } = useGetQuizResults(params.id);

  const currentUserRowRef = useRef<HTMLLIElement>(null);

  // Auto-scroll to the current user's row if they are in the leaderboard
  useEffect(() => {
    if (data?.leaderboard && user && currentUserRowRef.current) {
      setTimeout(() => {
        currentUserRowRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 500); // small delay to let page render
    }
  }, [data?.leaderboard, user]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
        <p className="text-muted-foreground mb-6">{(error as Error).message}</p>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  if (isLoading || !isUserLoaded) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <header className="flex h-16 shrink-0 items-center border-b border-border bg-card px-6">
          <Skeleton className="h-6 w-32" />
        </header>
        <main className="flex-1 p-6 flex justify-center">
          <div className="w-full max-w-3xl space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  const quiz = data?.quiz;
  const leaderboard = data?.leaderboard || [];

  const top3 = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  const isCreator = quiz?.creatorId === user?.id;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-6 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">{quiz?.title}</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Final Results</p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-muted/20 p-6 md:p-10 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">Quiz Leaderboard</h2>
            <p className="text-muted-foreground text-lg">Final standings for all participants</p>
          </div>

          {/* PODIUM (Top 3) */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-end">
              {/* Silver (Rank 2) */}
              {top3[1] && (
                <div className="order-2 md:order-1 flex flex-col items-center">
                  <PodiumCard entry={top3[1]} rank={2} color="bg-slate-400" currentUserId={user?.id} />
                  <div className="w-full h-32 bg-slate-300/30 rounded-t-lg border border-slate-300/50 mt-4 flex items-center justify-center">
                    <span className="text-4xl font-black text-slate-400/50">2</span>
                  </div>
                </div>
              )}
              
              {/* Gold (Rank 1) */}
              {top3[0] && (
                <div className="order-1 md:order-2 flex flex-col items-center">
                  <PodiumCard entry={top3[0]} rank={1} color="bg-amber-500" currentUserId={user?.id} icon={<Crown className="h-8 w-8 text-white mb-1" />} />
                  <div className="w-full h-48 bg-amber-500/20 rounded-t-lg border border-amber-500/40 mt-4 flex items-center justify-center">
                    <span className="text-5xl font-black text-amber-500/50">1</span>
                  </div>
                </div>
              )}
              
              {/* Bronze (Rank 3) */}
              {top3[2] && (
                <div className="order-3 md:order-3 flex flex-col items-center">
                  <PodiumCard entry={top3[2]} rank={3} color="bg-orange-700" currentUserId={user?.id} />
                  <div className="w-full h-24 bg-orange-700/20 rounded-t-lg border border-orange-700/40 mt-4 flex items-center justify-center">
                    <span className="text-4xl font-black text-orange-700/40">3</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* THE REST OF THE LIST */}
          {restOfLeaderboard.length > 0 && (
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <ul className="divide-y divide-border">
                {restOfLeaderboard.map((entry: { studentId: string; totalScore: number; firstName: string | null; lastName: string | null; rollNumber: string | null }, idx: number) => {
                  const rank = idx + 4; // since slice(3)
                  const isMe = entry.studentId === user?.id;
                  
                  return (
                    <li 
                      key={entry.studentId} 
                      ref={isMe ? currentUserRowRef : null}
                      className={cn(
                        "flex items-center gap-4 px-6 py-4 transition-colors",
                        isMe ? "bg-primary/5 ring-inset ring-2 ring-primary relative" : "hover:bg-muted/50"
                      )}
                    >
                      {/* Rank Number */}
                      <div className="w-10 font-mono text-lg font-bold text-muted-foreground text-right shrink-0">
                        #{rank}
                      </div>
                      
                      {/* Name + Roll Number */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("font-semibold truncate text-lg", isMe ? "text-primary" : "text-foreground")}>
                            {[entry.firstName, entry.lastName].filter(Boolean).join(" ") || "Unknown Student"}
                          </p>
                          {isMe && (
                            <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        {entry.rollNumber && (
                          <span className="inline-block font-mono text-xs bg-muted text-muted-foreground rounded px-2 py-0.5 mt-1 max-w-full truncate">
                            {entry.rollNumber}
                          </span>
                        )}
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <span className={cn("text-xl font-bold", isMe ? "text-primary" : "text-foreground")}>
                          {entry.totalScore}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">pts</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {leaderboard.length === 0 && (
            <div className="text-center py-20 bg-card rounded-xl border border-border shadow-sm">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-2xl font-bold text-foreground">No Results</h3>
              <p className="text-muted-foreground mt-2">Nobody participated in this quiz.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Helper Component for Podium Cards
function PodiumCard({ entry, rank, color, currentUserId, icon }: { entry: any, rank: number, color: string, currentUserId?: string, icon?: React.ReactNode }) {
  const isMe = entry.studentId === currentUserId;
  const name = [entry.firstName, entry.lastName].filter(Boolean).join(" ") || "Unknown Student";
  
  return (
    <div className={cn(
      "w-full flex flex-col items-center p-4 rounded-xl shadow-lg border-2 text-center transition-transform hover:-translate-y-1 relative",
      color,
      isMe ? "ring-4 ring-primary ring-offset-2 ring-offset-background" : "border-transparent"
    )}>
      {isMe && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm border border-primary/20">
          You
        </div>
      )}
      {icon || <Medal className="h-8 w-8 text-white mb-1" />}
      <p className="font-bold text-white text-lg leading-tight truncate w-full" title={name}>{name}</p>
      {entry.rollNumber && (
        <span className="inline-block font-mono text-xs bg-black/20 text-white rounded px-2 py-0.5 mt-1 truncate max-w-full">
          {entry.rollNumber}
        </span>
      )}
      <div className="mt-3 bg-black/20 px-3 py-1 rounded-full w-full">
        <span className="text-xl font-black text-white">{entry.totalScore}</span>
        <span className="text-xs text-white/80 ml-1">pts</span>
      </div>
    </div>
  );
}
