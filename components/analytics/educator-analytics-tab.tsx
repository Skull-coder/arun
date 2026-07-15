"use client";

import { useGetEducatorAnalytics } from "@/hooks/tanstackQuery/analytics/use-get-educator-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, Users, BookOpenCheck, AlertCircle, 
  Trophy, Brain, Flame
} from "lucide-react";

export function EducatorAnalyticsTab({ classroomId }: { classroomId: number }) {
  const { data, isLoading, error } = useGetEducatorAnalytics(classroomId);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-destructive font-medium">Failed to load analytics.</div>;
  }

  const { overview, insights } = data;

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12">
      
      {/* ─── ROW 1: Classroom Health ─── */}
      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart className="h-5 w-5 text-primary" /> Classroom Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3 text-muted-foreground">
              <Brain className="h-5 w-5" />
              <span className="font-medium">Class Average Score</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">{overview.classAverageScore}</span>
              <span className="text-xl font-bold text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Overall test accuracy</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3 text-muted-foreground">
              <BookOpenCheck className="h-5 w-5" />
              <span className="font-medium">Overall Submission Rate</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">{overview.classSubmissionRate}</span>
              <span className="text-xl font-bold text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Total assignments turned in</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center gap-3 mb-3 text-emerald-600 dark:text-emerald-500">
              <Users className="h-5 w-5" />
              <span className="font-medium">Active Students (7 Days)</span>
            </div>
            <div className="flex items-baseline gap-2 text-emerald-600 dark:text-emerald-500">
              <span className="text-4xl font-black">{overview.activeStudents}</span>
              <span className="text-sm font-medium opacity-80">/ {overview.totalStudents} total</span>
            </div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-2 font-medium">
              Submitted work recently
            </p>
          </div>

        </div>
      </section>

      {/* ─── ROW 2: Student Insights ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Needs Attention */}
        <div className="bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <AlertCircle className="h-5 w-5" /> Needs Attention
          </h4>
          {insights.needsAttention.length === 0 ? (
            <p className="text-sm text-rose-600/80 dark:text-rose-400/80 py-4">No students are currently falling behind.</p>
          ) : (
            <div className="space-y-4">
              {insights.needsAttention.map((student: any, index: number) => (
                <div key={student.studentId} className="flex items-center gap-4 bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 font-bold flex items-center justify-center text-sm shrink-0">
                    !
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                  </div>
                  <div className="text-right text-rose-600 dark:text-rose-400">
                    <div className="font-black text-lg">{student.avgAccuracy}%</div>
                    <div className="text-[10px] font-bold uppercase opacity-80 mt-[-4px]">Avg</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Performers */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
            <Trophy className="h-5 w-5" /> Top Performers
          </h4>
          {insights.topPerformers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Not enough data to rank students yet.</p>
          ) : (
            <div className="space-y-4">
              {insights.topPerformers.map((student: any, index: number) => (
                <div key={student.studentId} className="flex items-center gap-4 bg-muted/30 p-3 rounded-xl border border-border/50">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-500 font-bold flex items-center justify-center text-sm shrink-0">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                  </div>
                  <div className="text-right text-primary">
                    <div className="font-black text-lg">{student.avgAccuracy}%</div>
                    <div className="text-[10px] font-bold uppercase opacity-80 mt-[-4px]">Avg</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>

      {/* ─── ROW 3: Content Insights ─── */}
      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" /> Content Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-1">Toughest Test</p>
            {insights.toughestTest ? (
              <>
                <h4 className="font-bold text-lg">{insights.toughestTest.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">Class Average: <span className="font-bold text-destructive">{insights.toughestTest.avgScore}%</span></p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-2">No tests completed yet.</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-1">Most Challenging Assignment</p>
            {insights.toughestAssignment ? (
              <>
                <h4 className="font-bold text-lg">{insights.toughestAssignment.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">Returned Rate: <span className="font-bold text-destructive">{insights.toughestAssignment.returnRate}%</span></p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-2">No assignments returned yet.</p>
            )}
          </div>

        </div>
      </section>

    </div>
  );
}
