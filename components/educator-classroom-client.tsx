"use client";

import { useState, use, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGetClassroom } from "@/hooks/tanstackQuery/classroom/use-get-classroom";
import { useUpdateClassroom } from "@/hooks/tanstackQuery/classroom/use-update-classroom";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Check, Copy, UserCheck, UserX, Trash2,
  Users, ClipboardList, BookOpenCheck, Bell, Settings, Search,
  ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Tab = "students" | "tests" | "assignments" | "updates" | "settings";

export function EducatorClassroomClient({ classroomId }: { classroomId: number }) {
  const router = useRouter();
  
  const { data, isLoading } = useGetClassroom(classroomId);
  const { mutate: updateClassroom, isPending: isUpdating } = useUpdateClassroom();
  const { mutate: updateMember } = useUpdateMemberStatus();
  const { mutate: removeMember } = useRemoveMember();

  const [activeTab, setActiveTab] = useState<Tab>("students");
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Settings Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isAccepting, setIsAccepting] = useState(true);

  // Student Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (data?.classroom) {
      setName(data.classroom.name);
      setDescription(data.classroom.description || "");
      setIsAccepting(data.classroom.isAcceptingRequests);
    }
  }, [data]);

  const classroom = data?.classroom;
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

  const copyCode = () => {
    if (!classroom?.joinCode) return;
    navigator.clipboard.writeText(classroom.joinCode);
    setCopied(true);
    toast.success("Join code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = () => {
    if (!name.trim()) return toast.error("Classroom name is required");
    updateClassroom(
      { id: classroomId, data: { name, description, isAcceptingRequests: isAccepting } },
      { onSuccess: () => toast.success("Settings saved successfully!") }
    );
  };

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

  if (isLoading) {
    return (
      <div className="flex h-screen p-8 gap-8">
        <Skeleton className="h-full w-64" />
        <div className="flex-1 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h2 className="text-xl font-bold">Classroom not found</h2>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const navItems = [
    { id: "students", label: "Students", icon: Users },
    { id: "tests", label: "Tests", icon: ClipboardList, soon: true },
    { id: "assignments", label: "Assignments", icon: BookOpenCheck, soon: true },
    { id: "updates", label: "Updates", icon: Bell, soon: true },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn("relative flex flex-col border-r border-border bg-card transition-all duration-300", collapsed ? "w-[68px]" : "w-64")}>
        <div className="p-4 border-b border-border">
          <Button asChild variant="ghost" className={cn("w-full justify-start gap-2 text-muted-foreground hover:text-foreground", collapsed && "justify-center px-0")}>
            <Link href="/dashboard/classrooms">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              {!collapsed && "Back to Classrooms"}
            </Link>
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.soon && setActiveTab(item.id)}
              disabled={item.soon}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                collapsed && "justify-center px-0",
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.soon && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 leading-tight">
                      Soon
                    </Badge>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
        
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-[32px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center border-b border-border bg-card/50 px-8 py-5">
          <h2 className="text-2xl font-semibold">{classroom.name}</h2>
          {!classroom.isAcceptingRequests && (
            <Badge variant="secondary" className="ml-3 text-xs">Closed</Badge>
          )}
        </header>

        <div className="flex-1 overflow-auto p-8">
          {activeTab === "students" && (
            <div className="space-y-6 max-w-6xl mx-auto">
              
              {/* Filters */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 border-none shadow-none focus-visible:ring-0"
                  />
                </div>
                <Separator orientation="vertical" className="h-6" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[180px] border-none shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="approved">Approved Only</SelectItem>
                    <SelectItem value="pending">Pending Only</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery || statusFilter !== "all") && (
                  <>
                    <Separator orientation="vertical" className="h-6" />
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
              <div className="rounded-md border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Email</TableHead>
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
                            <TableCell className="font-medium">{studentName}</TableCell>
                            <TableCell className="text-muted-foreground">{m.student.email}</TableCell>
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
          )}

          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-8">
              <div>
                <h3 className="text-lg font-semibold">Join Code</h3>
                <p className="text-sm text-muted-foreground mb-4">Share this code with students so they can request to join.</p>
                <div className="flex items-center gap-4">
                  <code className="rounded bg-muted px-3 py-1.5 text-lg font-mono font-bold tracking-widest text-primary border border-border">
                    {classroom.joinCode}
                  </code>
                  <Button variant="outline" onClick={copyCode} className="gap-2">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy Code"}
                  </Button>
                </div>
              </div>
              
              <Separator />

              <div>
                <h3 className="text-lg font-semibold">Classroom Details</h3>
                <p className="text-sm text-muted-foreground mb-4">Update your classroom information and enrollment settings.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Classroom Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Accepting Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new students to request to join using the join code.
                    </p>
                  </div>
                  <Switch
                    checked={isAccepting}
                    onCheckedChange={setIsAccepting}
                  />
                </div>
              </div>

              <div className="flex justify-start pt-4 mt-6">
                <Button onClick={handleSaveSettings} disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
