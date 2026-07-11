"use client";

import { useState } from "react";
import { useGetTests } from "@/hooks/tanstackQuery/test/use-get-tests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { format } from "date-fns";
import { ClipboardList, Play, Eye, Clock, Search, Trophy } from "lucide-react";
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Classroom Tests</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View and participate in tests assigned by your educator.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-48"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tests</SelectItem>
              <SelectItem value="scheduled">Upcoming</SelectItem>
              <SelectItem value="ongoing">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Scheduled At</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      {/* Tests table */}
      {!isLoading && tests && tests.length > 0 && (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Scheduled At</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No tests match your filter.
                  </TableCell>
                </TableRow>
              )}
              {filteredTests?.map((test: any) => {
                const displayStatus = test.status;
                const isCompleted = displayStatus === "completed";

                return (
                  <TableRow key={test.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">
                      {test.title}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={displayStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {test.totalQuestions ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {test.totalMarks ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {test.durationMinutes} min
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {test.scheduledAt
                        ? format(new Date(test.scheduledAt), "MMM d, yyyy HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-2" asChild>
                          <Link href={`/dashboard/classroom/${classroomId}/test/${test.id}/lobby`}>
                            <Eye className="h-4 w-4" /> View
                          </Link>
                        </Button>
                        {isCompleted && (
                          <Button variant="secondary" size="sm" className="gap-2" asChild>
                            <Link href={`/dashboard/classroom/${classroomId}/test/${test.id}/results`}>
                              <Trophy className="h-4 w-4" /> Results
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
