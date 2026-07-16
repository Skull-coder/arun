"use client";

import { useRouter } from "next/navigation";
import { AppSidebar, MobileAppSidebar, type NavItem } from "@/components/app-sidebar";
import { EducatorClassrooms } from "./educator-classrooms";
import { StudentClassrooms } from "./student-classrooms";
import { BookOpen, GraduationCap, BarChart2 } from "lucide-react";

type Props = {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string | null;
    rollNumber?: string | null;
  };
};

export default function ClassroomsPageClient({ user }: Props) {
  const router = useRouter();

  const isEducator = user.role === "educator";

  const navItems: NavItem[] = isEducator
    ? [
        { label: "Library", icon: BookOpen, active: false, onClick: () => router.push("/dashboard") },
        { label: "Classrooms", icon: GraduationCap, active: true, onClick: () => router.push("/dashboard/classrooms") },
        { label: "Reports", icon: BarChart2, soon: true },
      ]
    : [
        { label: "My Quizzes", icon: BookOpen, active: false, onClick: () => router.push("/dashboard") },
        { label: "Classrooms", icon: GraduationCap, active: true, onClick: () => router.push("/dashboard/classrooms") },
        { label: "Performance", icon: BarChart2, soon: true },
      ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── SIDEBAR ── */}
      <AppSidebar user={user} navItems={navItems} />

      {/* ── MAIN ── */}
      <main className="flex flex-1 flex-col overflow-hidden bg-background p-4 md:p-8">
        {isEducator ? (
          <EducatorClassrooms mobileSidebar={<MobileAppSidebar user={user} navItems={navItems} />} />
        ) : (
          <StudentClassrooms mobileSidebar={<MobileAppSidebar user={user} navItems={navItems} />} />
        )}
      </main>
    </div>
  );
}
