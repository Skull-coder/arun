"use client";

import { useState } from "react";
import { useGetTests } from "@/hooks/tanstackQuery/test/use-get-tests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardCard } from "@/components/ui/dashboard-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { format } from "date-fns";
import { ClipboardList, Eye, Trophy, CalendarDays, Hash, Clock, Target, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  if (status === "scheduled") {
    return <Badge variant="secondary">Upcoming</Badge>;
  }

  if (status === "ongoing") {
    return (
      <span className="relative flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-sm font-medium">Live</span>
      </span>
    );
  }

  if (status === "completed") {
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        Completed
      </Badge>
    );
  }

  return <Badge variant="outline">{status}</Badge>;
}

export function StudentTestsTab({ classroomId }: { classroomId: number }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetTests(classroomId);
  const tests = data?.tests;

  const filteredTests = tests?.filter((test: any) => {
    const matchesStatus = statusFilter === "all" || test.status === statusFilter;
    const matchesSearch = !search || test.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Classroom Tests</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View and participate in tests assigned by your educator.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-full sm:w-48"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: "all", label: "All Tests" },
              { key: "scheduled", label: "Upcoming" },
              { key: "ongoing", label: "Live" },
              { key: "completed", label: "Completed" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  statusFilter === f.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col h-full border-border/60 shadow-sm">
              <CardHeader className="pb-4 gap-2 flex-row justify-between items-start space-y-0">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t mt-auto flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!tests || tests.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">No tests assigned</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your educator hasn't scheduled any tests yet. Check back later!
            </p>
          </div>
        </div>
      )}

      {/* Tests grid */}
      {!isLoading && tests && tests.length > 0 && (
        <>
          {filteredTests?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No tests match your filters.</p>
              <Button variant="link" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTests?.map((test: any) => {
                const displayStatus = test.status;
                const isCompleted = displayStatus === "completed";

                return (
                  <DashboardCard
                    key={test.id}
                    title={test.title}
                    statusNode={<StatusBadge status={displayStatus} />}
                    stats={[
                      {
                        icon: Hash,
                        value: test.totalQuestions ?? "—",
                        label: "Questions"
                      },
                      {
                        icon: Target,
                        value: test.totalMarks ?? "—",
                        label: "Marks"
                      },
                      {
                        icon: Clock,
                        value: test.durationMinutes,
                        label: "Mins"
                      }
                    ]}
                    footerLeft={
                      <>
                        <CalendarDays className="h-3.5 w-3.5" />
                        {test.scheduledAt ? format(new Date(test.scheduledAt), "MMM d, h:mm a") : "Anytime"}
                      </>
                    }
                    footerRight={
                      isCompleted ? (
                        <Button size="sm" className="gap-2 h-8" asChild>
                          <Link href={`/dashboard/classroom/${classroomId}/test/${test.id}/results`}>
                            <Trophy className="h-3.5 w-3.5" /> Results
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant={displayStatus === "ongoing" ? "default" : "outline"} className={cn("gap-2 h-8", displayStatus === "ongoing" && "bg-emerald-600 hover:bg-emerald-700 text-white")} asChild>
                          <Link href={`/dashboard/classroom/${classroomId}/test/${test.id}/lobby`}>
                            <Eye className="h-3.5 w-3.5" /> View
                          </Link>
                        </Button>
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
