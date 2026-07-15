"use client";

import { useGetStudentAnalytics } from "@/hooks/tanstackQuery/analytics/use-get-student-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ClipboardList, Target, Trophy, 
  BookOpenCheck, CheckCircle2, AlertCircle, 
  CalendarClock, ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function StudentAnalyticsTab({ classroomId }: { classroomId: number }) {
  const { data, isLoading, error } = useGetStudentAnalytics(classroomId);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        </div>
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-destructive font-medium">Failed to load analytics.</div>;
  }

  const { testAnalytics, assignmentAnalytics, upcoming } = data;

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12">
      
      {/* ─── ROW 1: Tests ─── */}
      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" /> Test Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3 text-muted-foreground">
              <ClipboardList className="h-5 w-5" />
              <span className="font-medium">Completion Rate</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{testAnalytics.completedTests}</span>
              <span className="text-muted-foreground text-sm font-medium">/ {testAnalytics.totalConductedTests} tests</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Total tests completed</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3 text-muted-foreground">
              <Target className="h-5 w-5" />
              <span className="font-medium">Overall Score</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{testAnalytics.totalObtainedMarks}</span>
              <span className="text-muted-foreground text-sm font-medium">/ {testAnalytics.totalPossibleMarks} pts</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Total marks gained</p>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center gap-3 mb-3 text-primary">
              <Trophy className="h-5 w-5" />
              <span className="font-medium">Average Accuracy</span>
            </div>
            <div className="flex items-baseline gap-1 text-primary">
              <span className="text-4xl font-black">{testAnalytics.averageAccuracy}</span>
              <span className="text-xl font-bold">%</span>
            </div>
            <p className="text-xs text-primary/80 mt-2 font-medium">Of total possible marks</p>
          </div>

        </div>
      </section>

      {/* ─── ROW 2: Assignments ─── */}
      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-indigo-500" /> Assignment Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3 text-muted-foreground">
              <BookOpenCheck className="h-5 w-5" />
              <span className="font-medium">Submission Rate</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">{assignmentAnalytics.submissionRate}</span>
              <span className="text-xl font-bold text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {assignmentAnalytics.submittedCount} out of {assignmentAnalytics.totalAssignments} submitted
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Acceptance Rate</span>
            </div>
            <div className="flex items-baseline gap-1 text-emerald-600">
              <span className="text-4xl font-black">{assignmentAnalytics.acceptanceRate}</span>
              <span className="text-xl font-bold">%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {assignmentAnalytics.acceptedCount} of your submissions were accepted
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Missed Rate</span>
            </div>
            <div className="flex items-baseline gap-2 text-rose-600 dark:text-rose-400">
              <span className="text-4xl font-black">{assignmentAnalytics.missedCount}</span>
            </div>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-2 font-medium">
              Assignments past due date
            </p>
          </div>

        </div>
      </section>

      {/* ─── ROW 3: Upcomings ─── */}
      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-orange-500" /> Upcoming Deadlines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {upcoming.nextTest ? (
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-none mb-3">Next Test</Badge>
                <h4 className="font-bold text-lg">{upcoming.nextTest.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Scheduled for: {format(new Date(upcoming.nextTest.scheduledAt!), "PPP 'at' p")}
                </p>
              </div>
              <Button asChild variant="outline" className="mt-6 self-start gap-2">
                <Link href={`/dashboard/classroom/${classroomId}/test/${upcoming.nextTest.id}/lobby`}>
                  Go to Lobby <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-2xl p-6 flex items-center justify-center text-muted-foreground text-sm shadow-sm h-full min-h-[140px]">
              No upcoming tests scheduled.
            </div>
          )}

          {upcoming.nextAssignment ? (
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div>
                <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 border-none mb-3">Next Assignment</Badge>
                <h4 className="font-bold text-lg">{upcoming.nextAssignment.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Due by: {format(new Date(upcoming.nextAssignment.dueDate!), "PPP 'at' p")}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-2xl p-6 flex items-center justify-center text-muted-foreground text-sm shadow-sm h-full min-h-[140px]">
              No upcoming assignments.
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
