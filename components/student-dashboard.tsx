import { SignOutButton } from "@clerk/nextjs";
import { GraduationCap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentDashboardProps {
  user: any;
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Student Portal</span>
          </div>

          <div className="space-y-1">
            <button className="w-full text-left px-4 py-3 rounded-xl bg-zinc-800 text-indigo-400 font-medium transition-all">
              Home
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all">
              My Classrooms
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all">
              Performance
            </button>
          </div>
        </div>

        <SignOutButton>
          <Button variant="ghost" className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-zinc-900">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </SignOutButton>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome back, {user.firstName || "Student"}!</h1>
          <p className="text-zinc-400 mt-2">Ready to learn and test your knowledge today?</p>
        </div>

        <div className="rounded-2xl border border-dashed border-zinc-800 p-20 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-zinc-400">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-200">Student Dashboard Placeholder</h2>
          <p className="text-zinc-500 max-w-sm mx-auto">
            The student portal features (joining classrooms, submitting assignments, tracking metrics) are coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
