"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useGetClassrooms } from "@/hooks/tanstackQuery/classroom/use-get-classrooms";
import { useJoinClassroom } from "@/hooks/tanstackQuery/classroom/use-join-classroom";
import Link from "next/link";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Zap, ArrowRight, Search, Clock, CalendarDays, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function StudentClassrooms({ mobileSidebar }: { mobileSidebar?: React.ReactNode }) {
  const { data, isLoading } = useGetClassrooms();
  const { mutate: joinClassroom, isPending: isJoining } = useJoinClassroom();

  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const memberships = data?.classrooms || [];

  const filtered = useMemo(() => {
    return memberships.filter((m: any) => {
      const q = search.toLowerCase();
      const matchesSearch = 
        !search ||
        m.classroom.name.toLowerCase().includes(q) ||
        (m.classroom.description ?? "").toLowerCase().includes(q);
        
      const matchesFilter = 
        filter === "all" ||
        (filter === "pending" && m.status === "pending") ||
        (filter === "approved" && m.status === "approved");
        
      return matchesSearch && matchesFilter;
    });
  }, [memberships, search, filter]);

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Please enter a valid join code");
      return;
    }
    
    joinClassroom(
      { joinCode: trimmed },
      {
        onSuccess: (res: any) => {
          if (res.classroom?.isAcceptingRequests === false) {
             // Let the backend handle errors usually, but just in case
          }
          toast.success("Request sent successfully! Waiting for educator approval.");
          setJoinOpen(false);
          setCode("");
        },
        onError: (err: any) => {
          toast.error(err.message || "Invalid code or classroom not found.");
        }
      }
    );
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
              Join classrooms to take tests.
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-2 shrink-0" onClick={() => setJoinOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Join Classroom</span>
        </Button>
      </header>

      {/* Search Bar & Filters */}
      {memberships.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center gap-3 border-y border-border bg-card/50 px-4 md:px-6 py-3 mb-6 -mx-4 md:-mx-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search classrooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: "all", label: "All Classrooms" },
              { key: "approved", label: "Approved" },
              { key: "pending", label: "Pending" },
            ].map((f) => (
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
          {(search || filter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              onClick={() => { setSearch(""); setFilter("all"); }}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Content Grid */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : memberships.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">No classrooms yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Ask your educator for a 6-character join code to enter their classroom.
            </p>
            <Button className="mt-6 gap-2" onClick={() => setJoinOpen(true)}>
              <Plus className="h-4 w-4" />
              Join a Classroom
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-base font-semibold text-foreground">No classrooms found</h2>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filtered.map((m: any) => {
                  const c = m.classroom;
                  const isPending = m.status === "pending";
                  return (
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
                        <Badge 
                          variant={isPending ? "secondary" : "default"} 
                          className={cn("shadow-none", isPending ? "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20" : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20")}
                        >
                          {isPending ? (
                            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3"/> Pending</span>
                          ) : (
                            <span className="flex items-center gap-1.5"><Zap className="h-3 w-3"/> Approved</span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(m.joinedAt), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {!isPending && (
                          <div className="flex items-center justify-end">
                            <Button asChild size="sm" variant="outline" className="h-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                              <Link href={`/dashboard/classroom/${c.id}`}>
                                Enter
                              </Link>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Join Classroom
            </DialogTitle>
            <DialogDescription>
              Enter the 6-character code provided by your educator to request access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="e.g. XK9M2P"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="font-mono tracking-widest text-center text-lg h-12 uppercase"
              maxLength={6}
              autoFocus
            />
            <Button
              onClick={handleJoin}
              disabled={isJoining || code.trim().length !== 6}
              className="w-full gap-2"
              size="lg"
            >
              {isJoining ? "Sending Request…" : "Submit Request"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
