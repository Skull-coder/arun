"use client";

import { useGetTestParticipants } from "@/hooks/tanstackQuery/test/use-get-test-participants";
import { useGetTest } from "@/hooks/tanstackQuery/test/use-get-test";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, FileBarChart, Trophy, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function EducatorTestLeaderboardClient({ classroomId, testId }: { classroomId: number; testId: number }) {
  const { data: participantsData, isLoading: isLoadingParticipants } = useGetTestParticipants(testId);
  const { data: testData, isLoading: isLoadingTest } = useGetTest(testId);
  const [search, setSearch] = useState("");

  const isLoading = isLoadingParticipants || isLoadingTest;
  const participants = participantsData?.participants ?? [];
  const test = testData?.test;

  const filteredParticipants = participants.filter((p: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (p.firstName?.toLowerCase() || "").includes(s) ||
      (p.lastName?.toLowerCase() || "").includes(s) ||
      (p.rollNumber?.toLowerCase() || "").includes(s)
    );
  });

  const exportToCSV = () => {
    if (!participants || participants.length === 0) return;
    
    // Headers: Roll Number, Name, Marks
    const headers = ["Roll Number", "Name", "Marks"];
    
    // Rows
    const rows = participants.map((p: any) => {
      const rollNumber = p.rollNumber || "";
      const name = `${p.firstName} ${p.lastName}`.trim();
      const marks = p.totalScore;
      return `"${rollNumber}","${name}","${marks}"`;
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${test?.title || 'test'}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-8 w-1/3" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full lg:w-[80%] max-w-6xl mx-auto py-6 sm:py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href={`/dashboard/classroom/${classroomId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Results & Leaderboard
          </h1>
          <p className="text-muted-foreground">{test?.title}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground border border-border bg-card px-4 py-2 rounded-lg">
            <Users className="h-4 w-4" /> {participants.length} Participants
          </div>
          <Button variant="default" onClick={exportToCSV} disabled={participants.length === 0}>
            Export CSV
          </Button>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center flex flex-col items-center gap-3">
          <FileBarChart className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">No Submissions Yet</h3>
          <p className="text-muted-foreground">None of the students have submitted this test.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto bg-card">
          <Table className="min-w-[600px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Rank</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.map((p: any, index: number) => {
                // Determine rank based on sorted order (assuming it was sorted by score DESC in backend? Wait, user asked to order by roll number ASC!)
                // The prompt said: "order the student basis of their rol number ascending"
                // So the table is sorted by roll number. Rank doesn't make sense if it's not sorted by score.
                // Let's just output their index + 1 or remove "Rank" and just put a #.
                return (
                  <TableRow key={p.sessionId} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">
                      #{index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {p.rollNumber || "—"}
                    </TableCell>
                    <TableCell>
                      {p.firstName} {p.lastName}
                      {p.email && <span className="text-muted-foreground text-xs block">{p.email}</span>}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {p.totalScore} <span className="text-muted-foreground text-xs font-normal">/ {test?.totalMarks}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/classroom/${classroomId}/test/${testId}/results/${p.studentId}`}>
                          View Attempt
                        </Link>
                      </Button>
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
