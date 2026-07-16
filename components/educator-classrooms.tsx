"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useGetClassrooms } from "@/hooks/tanstackQuery/classroom/use-get-classrooms";
import { useCreateClassroom } from "@/hooks/tanstackQuery/classroom/use-create-classroom";
import { useDeleteClassroom } from "@/hooks/tanstackQuery/classroom/use-delete-classroom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Copy, 
  Check, 
  GraduationCap,
  Settings,
  Search
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function EducatorClassrooms({ mobileSidebar }: { mobileSidebar?: React.ReactNode }) {
  const { data, isLoading } = useGetClassrooms();
  const { mutate: createClassroom, isPending: isCreating } = useCreateClassroom();
  const { mutate: deleteClassroom, isPending: isDeleting } = useDeleteClassroom();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  const [classroomToDelete, setClassroomToDelete] = useState<{ id: number; name: string } | null>(null);

  const classrooms = data?.classrooms || [];

  const filtered = useMemo(() => {
    return classrooms.filter((c: any) => {
      return !search || 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        (c.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        c.joinCode.toLowerCase().includes(search.toLowerCase());
    });
  }, [classrooms, search]);

  const handleCreate = () => {
    if (!name.trim()) return toast.error("Classroom name is required");
    createClassroom(
      { name, description },
      {
        onSuccess: () => {
          toast.success("Classroom created successfully!");
          setCreateOpen(false);
          setName("");
          setDescription("");
        },
      }
    );
  };

  const handleDelete = (id: number, name: string) => {
    setClassroomToDelete({ id, name });
  };

  const confirmDelete = () => {
    if (!classroomToDelete) return;
    deleteClassroom(classroomToDelete.id, {
      onSuccess: () => {
        toast.success("Classroom deleted.");
        setClassroomToDelete(null);
      }
    });
  };

  const copyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Join code copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 pb-6">
        <div className="flex items-center gap-3">
          <div className="md:hidden flex items-center">
            {mobileSidebar}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">My Classrooms</h1>
            <p className="mt-1 md:mt-2 text-sm md:text-base text-muted-foreground">
              Manage your student rosters, monitor requests, and organize your courses.
            </p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Classroom</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new classroom</DialogTitle>
              <DialogDescription>
                Students will be able to join using a unique 6-character code.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Classroom Name <span className="text-destructive">*</span></Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Computer Science 101" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (Optional)</Label>
                <Textarea 
                  id="desc" 
                  placeholder="What will your students learn?" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Filters */}
      {classrooms.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center gap-3 border-y border-border bg-card/50 px-4 md:px-6 py-3 mb-6 -mx-4 md:-mx-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, description, or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              onClick={() => setSearch("")}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Grid / Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : classrooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">No classrooms yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Create your first classroom to invite students and manage their progress.
            </p>
            <Button className="mt-6 gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Classroom
            </Button>
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Name</TableHead>
                    <TableHead>Join Code</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c: any) => (
                    <TableRow key={c.id} className="group">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground text-sm">{c.name}</p>
                          {c.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono tracking-wider text-foreground">
                            {c.joinCode}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => copyCode(c.joinCode, c.id)}
                          >
                            {copiedId === c.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(c.createdAt), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button asChild variant="default" size="sm" className="h-8 gap-1.5 text-xs">
                            <Link href={`/dashboard/classroom/${c.id}`}>
                              <Settings className="h-3.5 w-3.5" />
                              Enter
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={isDeleting}
                            onClick={() => handleDelete(c.id, c.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!classroomToDelete} onOpenChange={(open) => !open && setClassroomToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the classroom "{classroomToDelete?.name}" 
              and remove all enrolled students. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
