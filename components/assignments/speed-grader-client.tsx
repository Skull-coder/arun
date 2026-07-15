"use client";

import { useState } from "react";
import { useGetAssignments } from "@/hooks/tanstackQuery/assignment/use-get-assignments";
import { useGetSubmissions } from "@/hooks/tanstackQuery/assignment/use-get-submissions";
import { useGetFeedback, useEvaluateAssignment } from "@/hooks/tanstackQuery/assignment/use-evaluate-assignment";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  Users,
  Download,
  Loader2,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Submission = {
  submission: {
    id: number;
    assignmentId: number;
    studentId: string;
    fileUrl: string;
    fileName: string;
    status: string;
    submittedAt: string;
    updatedAt: string;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    rollNumber: string | null;
  };
  viewUrl: string;
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  submitted: {
    label: "Submitted",
    dot: "bg-blue-500",
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  resubmitted: {
    label: "Re-submitted",
    dot: "bg-purple-500",
    badge: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  returned: {
    label: "Returned",
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  accepted: {
    label: "Accepted",
    dot: "bg-green-500",
    badge: "bg-green-500/10 text-green-600 border-green-500/20",
  },
};

function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { dot: "bg-muted-foreground" };
  return <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.dot)} />;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, badge: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", cfg.badge)}>
      {cfg.label}
    </span>
  );
}

// --- Feedback panel for selected student ---
function FeedbackPanel({
  submission,
  classroomId,
  assignmentId,
}: {
  submission: Submission;
  classroomId: number;
  assignmentId: number;
}) {
  const { data: feedbackData } = useGetFeedback(classroomId, assignmentId, submission.submission.id);
  const evaluateAssignment = useEvaluateAssignment();
  const [feedback, setFeedback] = useState("");

  const handleEvaluate = (status: "accepted" | "returned") => {
    evaluateAssignment.mutate(
      {
        classroomId,
        assignmentId,
        submissionId: submission.submission.id,
        status,
        feedback: feedback.trim() || undefined,
      },
      { 
        onSuccess: () => {
          setFeedback("");
          toast.success(`Submission ${status === "accepted" ? "accepted" : "returned"}.`);
        },
        onError: (err: Error) => toast.error(err.message || "Failed to evaluate.")
      }
    );
  };

  const feedbackList = feedbackData?.feedback ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Student info */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {submission.student.firstName?.[0]}{submission.student.lastName?.[0]}
          </div>
          <div>
            <p className="font-semibold leading-tight">
              {submission.student.firstName} {submission.student.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{submission.student.rollNumber || submission.student.email}</p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={submission.submission.status} />
          </div>
        </div>

        {/* File submitted */}
        <div className="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm truncate">{submission.submission.fileName}</span>
          <span className="ml-auto text-xs text-muted-foreground shrink-0">
            {format(new Date(submission.submission.submittedAt), "MMM d, p")}
          </span>
        </div>
      </div>

      {/* Feedback history */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Feedback History</p>
        {feedbackList.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No feedback given yet.</p>
        ) : (
          feedbackList.map((f: any) => (
            <div key={f.feedback.id} className="bg-muted/40 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">
                {f.author.firstName} {f.author.lastName} · {format(new Date(f.feedback.createdAt), "MMM d, p")}
              </p>
              <p className="text-sm whitespace-pre-wrap">{f.feedback.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Evaluate panel */}
      {submission.submission.status !== "accepted" && (
        <div className="p-5 border-t border-border space-y-3 bg-card">
          <Textarea
            placeholder="Leave feedback (optional)..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[80px] resize-none text-sm"
          />
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2 bg-destructive hover:bg-destructive/90"
              onClick={() => handleEvaluate("returned")}
              disabled={evaluateAssignment.isPending}
            >
              {evaluateAssignment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Return
            </Button>
            <Button
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => handleEvaluate("accepted")}
              disabled={evaluateAssignment.isPending}
            >
              {evaluateAssignment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Accept
            </Button>
          </div>
        </div>
      )}

      {submission.submission.status === "accepted" && (
        <div className="p-5 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
            <CheckCircle2 className="h-5 w-5" /> This submission has been accepted.
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Speed Grader ---
export function SpeedGraderClient({
  classroomId,
  assignmentId,
}: {
  classroomId: number;
  assignmentId: number;
}) {
  const { data: assignmentsData } = useGetAssignments(classroomId);
  const { data: submissionsData, isLoading } = useGetSubmissions(classroomId, assignmentId);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const assignment = assignmentsData?.assignments?.find((a: any) => a.id === assignmentId);
  const submissions: Submission[] = submissionsData?.submissions ?? [];

  const STATUS_FILTERS = ["all", "submitted", "resubmitted", "returned", "accepted"];

  const filtered = submissions.filter((s) => {
    const name = `${s.student.firstName} ${s.student.lastName}`.toLowerCase();
    const roll = (s.student.rollNumber ?? "").toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = !q || name.includes(q) || roll.includes(q);
    const matchesStatus = statusFilter === "all" || s.submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selected = filtered[selectedIndex] ?? null;

  // CSV Export
  const exportCSV = () => {
    const rows = submissions.map((s) => {
      const name = `${s.student.firstName} ${s.student.lastName}`.trim();
      return `"${s.student.rollNumber ?? ""}","${name}","${STATUS_CONFIG[s.submission.status]?.label ?? s.submission.status}"`;
    });
    const csv = ["Roll Number,Name,Status", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${assignment?.title ?? "assignment"}_submissions.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Left Sidebar — Student List */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
              <Link href={`/dashboard/classroom/${classroomId}/assignments`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{assignment?.title ?? "Assignment"}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> {submissions.length} submissions
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search student..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0); }}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setSelectedIndex(0); }}
              className="w-full h-8 rounded-md border border-border bg-background px-3 pr-8 text-sm appearance-none cursor-pointer"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f} value={f}>
                  {f === "all" ? "All Statuses" : STATUS_CONFIG[f]?.label ?? f}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No submissions yet.</div>
          ) : (
            filtered.map((s, idx) => (
              <button
                key={s.submission.id}
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/50",
                  selectedIndex === idx
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/50 text-foreground"
                )}
              >
                <StatusDot status={s.submission.status} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {s.student.firstName} {s.student.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.student.rollNumber || s.student.email}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Export CSV */}
        <div className="p-3 border-t border-border">
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={exportCSV} disabled={submissions.length === 0}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </aside>

      {/* Center — PDF Viewer */}
      <main className="flex-1 flex flex-col overflow-hidden bg-muted/10">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <FileText className="h-12 w-12 opacity-30" />
            <p className="font-medium">Select a student to view their submission</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-3 border-b border-border bg-card flex items-center justify-between shrink-0">
              <p className="text-sm font-medium text-muted-foreground">{selected.submission.fileName}</p>
              <a
                href={selected.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
              >
                <Download className="h-3.5 w-3.5" /> Open in new tab
              </a>
            </div>
            <div className="flex-1 overflow-hidden">
              {selected.submission.fileName.endsWith(".pdf") ? (
                <iframe
                  key={selected.submission.id}
                  src={selected.viewUrl}
                  className="w-full h-full border-none"
                  title="Assignment PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-full p-8">
                  <img
                    key={selected.submission.id}
                    src={selected.viewUrl}
                    alt="Assignment"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Right panel — Feedback & actions */}
      <aside className="w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
        {selected ? (
          <FeedbackPanel
            key={selected.submission.id}
            submission={selected}
            classroomId={classroomId}
            assignmentId={assignmentId}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-6 text-center">
            Select a student from the list to start grading.
          </div>
        )}
      </aside>
    </div>
  );
}
