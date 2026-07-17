"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useGetClassroom } from "@/hooks/tanstackQuery/classroom/use-get-classroom";
import { useUpdateMemberStatus } from "@/hooks/tanstackQuery/classroom/use-update-member-status";
import { useRemoveMember } from "@/hooks/tanstackQuery/classroom/use-remove-member";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCheck, UserX, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function EducatorStudentsClient({ classroomId }: { classroomId: number }) {
  const { data, isLoading } = useGetClassroom(classroomId);
  const { mutate: updateMember } = useUpdateMemberStatus();
  const { mutate: removeMember } = useRemoveMember();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const members = data?.members || [];

  const filteredMembers = useMemo(() => {
    return members.filter((m: any) => {
      const studentName = [m.student.firstName, m.student.lastName].filter(Boolean).join(" ").toLowerCase();
      const email = (m.student.email || "").toLowerCase();
      const rollNo = (m.student.rollNumber || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = !searchQuery || studentName.includes(query) || email.includes(query) || rollNo.includes(query);
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [members, searchQuery, statusFilter]);

  const handleApprove = (studentId: string) => {
    updateMember({ classroomId, studentId, status: "approved" }, {
      onSuccess: () => toast.success("Student approved!")
    });
  };

  const handleReject = (studentId: string) => {
    updateMember({ classroomId, studentId, status: "rejected" }, {
      onSuccess: () => toast.success("Request rejected.")
    });
  };

  const handleRemove = (studentId: string, studentName: string) => {
    if (confirm(`Remove ${studentName} from this classroom?`)) {
      removeMember({ classroomId, studentId }, {
        onSuccess: () => toast.success("Student removed from classroom.")
      });
    }
  };

  if (isLoading) return <Skeleton className="w-full h-96" />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border border-border bg-card p-2">
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 border-none shadow-none focus-visible:ring-0"
          />
        </div>
        <Separator orientation="vertical" className="hidden md:block h-6" />
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { key: "all", label: "All Students" },
            { key: "approved", label: "Approved Only" },
            { key: "pending", label: "Pending Only" },
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
        {(searchQuery || statusFilter !== "all") && (
          <>
            <Separator orientation="vertical" className="hidden md:block h-6" />
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-9 px-3"
              onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
            >
              Clear
            </Button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Roll Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No students found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((m: any) => {
                const isPending = m.status === "pending";
                const studentName = [m.student.firstName, m.student.lastName].filter(Boolean).join(" ") || "Unknown";
                
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium whitespace-nowrap">{studentName}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{m.student.email}</TableCell>
                    <TableCell className="font-mono text-xs">{m.student.rollNumber || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={isPending ? "destructive" : "secondary"} className={isPending ? "bg-orange-500 hover:bg-orange-600 text-white border-transparent" : ""}>
                        {isPending ? "Pending" : "Approved"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="outline" title="Reject" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={() => handleReject(m.student.id)}>
                            <UserX className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="default" title="Approve" className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(m.student.id)}>
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Remove Student"
                          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemove(m.student.id, studentName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
