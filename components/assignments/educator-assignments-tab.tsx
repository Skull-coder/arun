"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useGetAssignments } from "@/hooks/tanstackQuery/assignment/use-get-assignments";
import { useCreateAssignment } from "@/hooks/tanstackQuery/assignment/use-create-assignment";
import { useUpdateAssignment } from "@/hooks/tanstackQuery/assignment/use-update-assignment";
import { useDeleteAssignment } from "@/hooks/tanstackQuery/assignment/use-delete-assignment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ClipboardList, Plus, MoreVertical, Edit2, Trash2, Users, CalendarDays, Loader2, ArrowRight } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

type Assignment = {
  id: number;
  classroomId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
};

const emptyForm = { title: "", description: "", dueDate: "" };

export function EducatorAssignmentsTab({ classroomId }: { classroomId: number }) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetAssignments(classroomId);
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const assignments: Assignment[] = data?.pages?.flatMap(p => p.assignments) || [];
  
  const { ref: observerRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingAssignment(null);
    setShowForm(true);
  };

  const openEdit = (a: Assignment) => {
    setForm({
      title: a.title,
      description: a.description ?? "",
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString() : "",
    });
    setEditingAssignment(a);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const payload = {
      classroomId,
      title: form.title,
      description: form.description,
      dueDate: form.dueDate || null,
    };

    if (editingAssignment) {
      updateAssignment.mutate(
        { ...payload, assignmentId: editingAssignment.id },
        { 
          onSuccess: () => {
            setShowForm(false);
            toast.success("Assignment updated.");
          },
          onError: (err: Error) => toast.error(err.message || "Failed to update.")
        }
      );
    } else {
      createAssignment.mutate(payload, { 
        onSuccess: () => {
          setShowForm(false);
          toast.success("Assignment created!");
        },
        onError: (err: Error) => toast.error(err.message || "Failed to create.")
      });
    }
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteAssignment.mutate(
      { classroomId, assignmentId: deletingId },
      { 
        onSuccess: () => {
          setDeletingId(null);
          toast.success("Assignment deleted.");
        },
        onError: (err: Error) => toast.error(err.message || "Failed to delete.")
      }
    );
  };

  const getDueBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date))
      return <Badge variant="destructive" className="text-[10px]">Overdue</Badge>;
    if (isToday(date))
      return <Badge className="text-[10px] bg-yellow-400 text-yellow-950 border-none">Due Today</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Due {format(date, "MMM d")}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Assignments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{assignments.length} assignment{assignments.length !== 1 ? "s" : ""} created</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm w-full sm:w-auto">
          <Plus className="h-4 w-4" /> New Assignment
        </Button>
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
          <div>
            <p className="font-semibold">No assignments yet</p>
            <p className="text-sm text-muted-foreground">Create one to get started!</p>
          </div>
          <Button onClick={openCreate} variant="outline" className="gap-2 mt-2">
            <Plus className="h-4 w-4" /> New Assignment
          </Button>
        </div>
      )}

      {/* Assignment Cards — vertical list */}
      {!isLoading && assignments.length > 0 && (
        <>
          <div className="flex flex-col gap-4">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="group relative bg-card border border-border rounded-2xl px-6 py-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
            >
              {/* Three-dot menu */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(a)}>
                      <Edit2 className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeletingId(a.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-col gap-3 pr-8">
                {/* Title row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-semibold text-base leading-tight">{a.title}</h3>
                  {getDueBadge(a.dueDate)}
                </div>

                {/* Description */}
                {a.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>
                )}

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 pt-3 border-t border-border/40 gap-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Created {format(new Date(a.createdAt), "MMM d, yyyy")}
                    </span>
                    {a.dueDate && (
                      <span className="flex items-center gap-1.5 font-medium">
                        Deadline: {format(new Date(a.dueDate), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm" className="gap-1.5 h-8 w-full sm:w-auto">
                    <Link href={`/dashboard/classroom/${classroomId}/assignments/${a.id}`}>
                      <Users className="h-3.5 w-3.5" /> View Submissions
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            ))}
          </div>
          
          {hasNextPage && (
            <div ref={observerRef} className="py-8 flex justify-center">
              <span className="text-sm text-muted-foreground animate-pulse">Loading more assignments...</span>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Edit Assignment" : "New Assignment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Chapter 3 Summary"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Write the assignment instructions..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Deadline (optional)</Label>
              <DateTimePicker
                value={form.dueDate ? new Date(form.dueDate) : undefined}
                onChange={(date) => setForm((f) => ({ ...f, dueDate: date ? date.toISOString() : "" }))}
                placeholder="Select deadline date & time"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title.trim() || createAssignment.isPending || updateAssignment.isPending}
            >
              {(createAssignment.isPending || updateAssignment.isPending) ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
              ) : editingAssignment ? "Save Changes" : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the assignment and all student submissions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteAssignment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
