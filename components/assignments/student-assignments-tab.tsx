"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useGetAssignments } from "@/hooks/tanstackQuery/assignment/use-get-assignments";
import { useGetSubmissions } from "@/hooks/tanstackQuery/assignment/use-get-submissions";
import { useSubmitAssignment } from "@/hooks/tanstackQuery/assignment/use-submit-assignment";
import { useUnsubmitAssignment } from "@/hooks/tanstackQuery/assignment/use-unsubmit-assignment";
import { useGetFeedback } from "@/hooks/tanstackQuery/assignment/use-evaluate-assignment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  ClipboardList,
  CalendarDays,
  Upload,
  Trash2,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  MessageSquare,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Assignment = {
  id: number;
  classroomId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_LABELS = "PDF, JPG, PNG";

// --- Status Badge ---
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    submitted: {
      label: "Submitted",
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      icon: <Clock className="h-3 w-3" />,
    },
    resubmitted: {
      label: "Re-submitted",
      className: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      icon: <RefreshCw className="h-3 w-3" />,
    },
    returned: {
      label: "Action Required",
      className: "bg-red-500/10 text-red-600 border-red-500/20",
      icon: <XCircle className="h-3 w-3" />,
    },
    accepted: {
      label: "Accepted",
      className: "bg-green-500/10 text-green-600 border-green-500/20",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
  };
  const s = map[status] ?? { label: status, className: "bg-muted text-muted-foreground", icon: null };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", s.className)}>
      {s.icon} {s.label}
    </span>
  );
}

// --- Single Assignment Card (with submission state inside) ---
function AssignmentCard({ assignment, classroomId, filter }: { assignment: Assignment; classroomId: number; filter: string }) {
  const { data, isLoading } = useGetSubmissions(classroomId, assignment.id);
  const submitAssignment = useSubmitAssignment();
  const unsubmitAssignment = useUnsubmitAssignment();

  const [uploadDialog, setUploadDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [unsubmitDialog, setUnsubmitDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const submission = data?.submission ?? null;

  // Fetch feedback only when there is a submission
  const { data: feedbackData } = useGetFeedback(classroomId, assignment.id, submission?.id ?? null);
  const feedbackList = feedbackData?.feedback ?? [];

  // --- Filter logic (evaluated after hooks) ---
  // Maps filter key to which statuses should show
  const shouldShow = () => {
    if (filter === "all") return true;
    if (!submission) return filter === "all"; // Not submitted — only show in "all"
    if (filter === "pending") return submission.status === "submitted" || submission.status === "resubmitted" || submission.status === "accepted";
    if (filter === "returned") return submission.status === "returned";
    if (filter === "accepted") return submission.status === "accepted";
    return true;
  };

  if (!shouldShow()) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError(`Only ${ALLOWED_LABELS} files are allowed.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size must be under 5MB.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirmSubmit = () => {
    if (!selectedFile) return;
    setUploadProgress(0); // Reset progress
    submitAssignment.mutate(
      { 
        classroomId, 
        assignmentId: assignment.id, 
        file: selectedFile,
        onProgress: (progress) => setUploadProgress(progress)
      },
      {
        onSuccess: () => {
          setConfirmDialog(false);
          setUploadDialog(false);
          setSelectedFile(null);
          setPreviewUrl(null);
          setUploadProgress(0);
          toast.success("Assignment submitted successfully!");
        },
        onError: (err: Error) => {
          setUploadProgress(0);
          toast.error(err.message || "Failed to submit assignment.");
        }
      }
    );
  };

  const handleUnsubmit = () => {
    unsubmitAssignment.mutate(
      { classroomId, assignmentId: assignment.id },
      { 
        onSuccess: () => {
          setUnsubmitDialog(false);
          toast.success("Assignment unsubmitted.");
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to unsubmit.");
        }
      }
    );
  };

  const getDueBadge = () => {
    if (!assignment.dueDate) return null;
    const date = new Date(assignment.dueDate);
    if (isPast(date) && !isToday(date))
      return <Badge variant="destructive" className="text-[10px]">Overdue</Badge>;
    if (isToday(date))
      return <Badge className="text-[10px] bg-yellow-400 text-yellow-950 border-none font-bold">Due Today</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Due {format(date, "MMM d")}</Badge>;
  };

  const canResubmit = submission?.status === "returned"; // Only when educator explicitly returned it
  const canUnsubmit = submission && (submission.status === "submitted" || submission.status === "resubmitted");

  return (
    <>
      <div className="group bg-card border border-border rounded-2xl px-6 py-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200">
        <div className="flex flex-col gap-3">
          {/* Title + badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-base leading-tight">{assignment.title}</h3>
              {getDueBadge()}
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-20 rounded-full" />
            ) : submission ? (
              <StatusBadge status={submission.status} />
            ) : null}
          </div>

          {/* Description */}
          {assignment.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
          )}

          {/* Returned feedback notice + feedback thread */}
          {(submission?.status === "returned" || submission?.status === "resubmitted") && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-600">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {submission.status === "returned"
                    ? "Your educator reviewed your submission and asked for changes. Please re-upload."
                    : "You have resubmitted. Awaiting educator review."}
                </span>
              </div>
              {feedbackList.length > 0 && (
                <div className="space-y-2 mt-1">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Educator Feedback
                  </p>
                  {feedbackList.map((f: any) => (
                    <div key={f.feedback.id} className="bg-muted/40 rounded-xl px-4 py-3 text-sm">
                      <p className="text-xs text-muted-foreground mb-1">
                        {f.author.firstName} {f.author.lastName} · {format(new Date(f.feedback.createdAt), "MMM d, p")}
                      </p>
                      <p className="whitespace-pre-wrap">{f.feedback.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Accepted with feedback */}
          {submission?.status === "accepted" && feedbackList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Your submission was accepted. Here's the feedback from your educator:</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Educator Feedback
                </p>
                {feedbackList.map((f: any) => (
                  <div key={f.feedback.id} className="bg-green-500/5 border border-green-500/10 rounded-xl px-4 py-3 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">
                      {f.author.firstName} {f.author.lastName} · {format(new Date(f.feedback.createdAt), "MMM d, p")}
                    </p>
                    <p className="whitespace-pre-wrap text-foreground">{f.feedback.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submitted file preview link */}
          {submission && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate font-medium text-foreground">{submission.fileName}</span>
              {submission.viewUrl && (
                <a
                  href={submission.viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto shrink-0 flex items-center gap-1 text-primary hover:underline text-xs font-semibold"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </a>
              )}
            </div>
          )}

          {/* Actions footer */}
          <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/60">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {assignment.dueDate
                ? `Deadline: ${format(new Date(assignment.dueDate), "MMM d, yyyy")}`
                : "No deadline"}
            </span>

            <div className="flex items-center gap-2">
              {canUnsubmit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive gap-1.5"
                  onClick={() => setUnsubmitDialog(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Unsubmit
                </Button>
              )}
              {(!submission || canResubmit) && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => { 
                    setSelectedFile(null); 
                    setPreviewUrl(null); 
                    setFileError(""); 
                    setUploadProgress(0);
                    setUploadDialog(true); 
                  }}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {submission ? "Re-upload" : "Submit"}
                </Button>
              )}
              {submission?.status === "accepted" && (
                <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> Accepted
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>Only PDF, JPG, or PNG files under 5MB are accepted.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-sm">Click to select file</p>
                <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG, PNG • Max 5MB</p>
              </div>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
            </label>

            {fileError && <p className="text-sm text-destructive">{fileError}</p>}

            {selectedFile && previewUrl && (
              <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
                <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                {selectedFile.type === "application/pdf" ? (
                  <iframe src={previewUrl} className="w-full h-64" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-contain p-2" />
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadDialog(false)}>Cancel</Button>
            <Button
              onClick={() => setConfirmDialog(true)}
              disabled={!selectedFile || !!fileError}
            >
              Preview & Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm submission dialog */}
      <AlertDialog open={confirmDialog} onOpenChange={(open) => {
        // Prevent closing by clicking outside if uploading
        if (!open && submitAssignment.isPending) return;
        setConfirmDialog(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  You are about to submit <strong>{selectedFile?.name}</strong> for <strong>{assignment.title}</strong>. This cannot be undone without educator approval.
                </p>
                {submitAssignment.isPending && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-primary">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitAssignment.isPending}>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // prevent dialog close automatically
                handleConfirmSubmit();
              }}
              disabled={submitAssignment.isPending}
            >
              {submitAssignment.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading...</> : "Confirm & Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsubmit dialog */}
      <AlertDialog open={unsubmitDialog} onOpenChange={setUnsubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsubmit Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              Your submission will be removed. You can re-submit again before the deadline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsubmit}
              className="bg-destructive hover:bg-destructive/90"
              disabled={unsubmitAssignment.isPending}
            >
              {unsubmitAssignment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unsubmit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- Filter type ---
type FilterType = "all" | "pending" | "returned" | "accepted";

export function StudentAssignmentsTab({ classroomId }: { classroomId: number }) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetAssignments(classroomId);
  const [filter, setFilter] = useState<FilterType>("all");

  const assignments: Assignment[] = data?.pages?.flatMap(p => p.assignments) || [];
  
  const { ref: observerRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  // Sort by dueDate ascending (most urgent first), nulls last
  const sorted = [...assignments].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Submitted" },
    { key: "returned", label: "Action Required" },
    { key: "accepted", label: "Accepted" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Assignments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{assignments.length} assignment{assignments.length !== 1 ? "s" : ""}</p>
        </div>
        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && assignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4 rounded-2xl border border-dashed border-border">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <ClipboardList className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="font-semibold">No assignments yet</p>
          <p className="text-sm text-muted-foreground">Your educator hasn&apos;t posted any assignments.</p>
        </div>
      )}

      {/* Cards */}
      {!isLoading && sorted.length > 0 && (
        <>
          <div className="flex flex-col gap-4">
          {sorted.map((a) => (
            <AssignmentCard key={a.id} assignment={a} classroomId={classroomId} filter={filter} />
          ))}
          </div>
          
          {hasNextPage && (
            <div ref={observerRef} className="py-8 flex justify-center">
              <span className="text-sm text-muted-foreground animate-pulse">Loading more assignments...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
