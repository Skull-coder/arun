"use client";

import { useState } from "react";
import { useGetClassroom } from "@/hooks/tanstackQuery/classroom/use-get-classroom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Users, ClipboardList, BookOpenCheck, Bell, Settings,
  ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Tab = "students" | "tests" | "assignments" | "updates" | "settings";

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
  };

  const navItems: NavItem[] = [
    { id: "students", label: "Students", icon: Users, href: `/dashboard/classroom/${classroomId}` },
    { id: "tests", label: "Tests", icon: ClipboardList, href: `/dashboard/classroom/${classroomId}/tests` },
    { id: "assignments", label: "Assignments", icon: BookOpenCheck, soon: true },
    { id: "updates", label: "Updates", icon: Bell, soon: true },
    { id: "settings", label: "Settings", icon: Settings, href: `/dashboard/classroom/${classroomId}/settings` },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn("relative flex flex-col border-r border-border bg-card transition-all duration-300", collapsed ? "w-[68px]" : "w-64")}>
        <div className="p-4 border-b border-border">
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
                  <span className="flex-1 text-left">{item.label}</span>
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
          className="absolute -right-3 top-[32px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
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
          {children}
        </div>
      </main>
    </div>
  );
}
