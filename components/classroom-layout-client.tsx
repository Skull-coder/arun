"use client";

import { useState } from "react";
import { useGetClassroom } from "@/hooks/tanstackQuery/classroom/use-get-classroom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Users, ClipboardList, BookOpenCheck, Bell, Settings,
  ChevronLeft, ChevronRight, BarChart, GraduationCap
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useGetUnreadUpdatesCount } from "@/hooks/tanstackQuery/update/use-get-unread-count";

type Tab = "analytics" | "students" | "tests" | "assignments" | "updates" | "settings";

export function ClassroomLayoutClient({ 
  classroomId, 
  activeTab, 
  children 
}: { 
  classroomId: number;
  activeTab: Tab;
  children: React.ReactNode;
}) {
  const { data, isLoading } = useGetClassroom(classroomId);
  const { data: unreadCount = 0 } = useGetUnreadUpdatesCount(classroomId);
  const [collapsed, setCollapsed] = useState(false);

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

  const classroom = data?.classroom;

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

  type NavItem = {
    id: Tab;
    label: string;
    icon: React.ElementType;
    href?: string;
    soon?: boolean;
    badgeCount?: number;
  };

  const navItems: NavItem[] = [
    { id: "analytics", label: "Analytics", icon: BarChart, href: `/dashboard/classroom/${classroomId}` },
    { id: "students", label: "Students", icon: Users, href: `/dashboard/classroom/${classroomId}/students` },
    { id: "tests", label: "Tests", icon: ClipboardList, href: `/dashboard/classroom/${classroomId}/tests` },
    { id: "assignments", label: "Assignments", icon: BookOpenCheck, href: `/dashboard/classroom/${classroomId}/assignments` },
    { id: "updates", label: "Updates", icon: Bell, badgeCount: unreadCount, href: `/dashboard/classroom/${classroomId}/updates` },
    { id: "settings", label: "Settings", icon: Settings, href: `/dashboard/classroom/${classroomId}/settings` },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn("relative z-20 flex flex-col border-r border-border bg-card transition-all duration-300", collapsed ? "w-[68px]" : "w-64")}>
        <div className="h-[72px] shrink-0 flex items-center px-4 border-b border-border">
          <Button asChild variant="ghost" className={cn("w-full justify-start gap-2 text-muted-foreground hover:text-foreground", collapsed && "justify-center px-0")}>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              {!collapsed && "Back to Dashboard"}
            </Link>
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.soon ? "#" : (item.href || "#")}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.soon ? "opacity-50 pointer-events-none" : "",
                collapsed && "justify-center px-0",
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left flex items-center justify-between">
                    {item.label}
                    {item.badgeCount ? (
                      <Badge className="ml-2 px-1.5 py-0 min-w-[20px] justify-center text-[10px] bg-yellow-400 text-yellow-950 hover:bg-yellow-500 border-none font-bold shadow-sm">
                        {item.badgeCount}
                      </Badge>
                    ) : null}
                  </span>
                  {item.soon && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 leading-tight">
                      Soon
                    </Badge>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>
        
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-[60px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[72px] shrink-0 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 bg-card/80 backdrop-blur-xl px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-inner">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground leading-none">{classroom.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Educator View</span>
                {!classroom.isAcceptingRequests && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-orange-500/10 text-orange-600 border-none font-bold">Closed</Badge>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
