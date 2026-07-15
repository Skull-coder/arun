"use client";

import { useState } from "react";
import { useGetClassroom } from "@/hooks/tanstackQuery/classroom/use-get-classroom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Users, 
  ClipboardList, 
  BookOpenCheck, 
  Bell, 
  ChevronLeft,
  ChevronRight,
  BarChart
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StudentTestsTab } from "@/components/student-tests-tab";
import { StudentUpdatesTab } from "@/components/updates/student-updates-tab";
import { StudentAssignmentsTab } from "@/components/assignments/student-assignments-tab";
import { StudentAnalyticsTab } from "@/components/analytics/student-analytics-tab";
import { StudentPeopleTab } from "@/components/people/student-people-tab";
import { useGetUnreadUpdatesCount } from "@/hooks/tanstackQuery/update/use-get-unread-count";

type Tab = "analytics" | "tests" | "assignments" | "updates" | "people";

export function StudentClassroomClient({ classroomId }: { classroomId: number }) {
  const { data, isLoading, error } = useGetClassroom(classroomId);
  const { data: unreadCount = 0 } = useGetUnreadUpdatesCount(classroomId);

  const [activeTab, setActiveTab] = useState<Tab>("analytics");
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

  // If there's an error (e.g. pending approval or unauthorized), we show it beautifully.
  if (error || !data?.classroom) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4 bg-background p-8 text-center">
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground">
          {error?.message || "You are not an approved member of this classroom or it is pending approval."}
        </p>
        <Button asChild>
          <Link href="/dashboard/classrooms">Back to Classrooms</Link>
        </Button>
      </div>
    );
  }

  const classroom = data.classroom;

  type NavItem = {
    id: Tab;
    label: string;
    icon: React.ElementType;
    soon?: boolean;
    badgeCount?: number;
  };

  const navItems: NavItem[] = [
    { id: "analytics", label: "Analytics", icon: BarChart },
    { id: "tests", label: "Tests", icon: ClipboardList },
    { id: "assignments", label: "Assignments", icon: BookOpenCheck },
    { id: "updates", label: "Updates", icon: Bell, badgeCount: unreadCount },
    { id: "people", label: "People", icon: Users },
  ];

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
              onClick={() => !item.soon && setActiveTab(item.id as Tab)}
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
          <Badge variant="secondary" className="ml-3 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            Enrolled
          </Badge>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {activeTab === "analytics" && (
            <StudentAnalyticsTab classroomId={classroomId} />
          )}
          {activeTab === "tests" && (
            <StudentTestsTab classroomId={classroomId} />
          )}
          {activeTab === "assignments" && (
            <StudentAssignmentsTab classroomId={classroomId} />
          )}
          {activeTab === "updates" && (
            <StudentUpdatesTab classroomId={classroomId} />
          )}
          {activeTab === "people" && (
            <StudentPeopleTab classroomId={classroomId} />
          )}
        </div>
      </main>
    </div>
  );
}
