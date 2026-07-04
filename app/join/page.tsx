"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useJoinQuiz } from "@/hooks/tanstackQuery/quiz/use-join-quiz";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Gamepad2, ArrowRight } from "lucide-react";

export default function JoinQuizPage() {
  const [joinCode, setJoinCode] = useState("");
  const router = useRouter();
  const { mutate: joinQuiz, isPending } = useJoinQuiz();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a valid join code.");
      return;
    }
    
    joinQuiz(
      { joinCode: code },
      {
        onSuccess: (data) => {
          toast.success("Successfully joined!");
          router.push(`/quiz/${data.quizId}`);
        },
        onError: (err) => {
          toast.error(err.message || "Invalid join code. Please try again.");
        }
      }
    );
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
      
      <Card className="w-full max-w-md border-2 border-border shadow-2xl relative z-10">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 shadow-inner">
            <Gamepad2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black text-foreground">Join a Quiz</CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-2">
            Enter the 6-character code provided by your educator.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleJoin}>
          <CardContent className="space-y-6 px-10">
            <div className="space-y-3">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. XK9M2P"
                maxLength={6}
                className="h-16 text-center text-3xl font-black tracking-[0.25em] uppercase shadow-sm border-2 focus-visible:ring-primary/20"
                autoFocus
              />
            </div>
          </CardContent>

          <CardFooter className="px-10 pb-10">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-14 text-lg font-bold group shadow-md"
              disabled={isPending || joinCode.length < 3}
            >
              {isPending ? "Joining..." : "Enter Quiz"}
              {!isPending && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
