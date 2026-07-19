"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUpdateRole } from "@/hooks/tanstackQuery/auth/use-update-role";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraduationCap, Presentation, CheckCircle2, ArrowRight, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const roles = [
  {
    value: "educator" as const,
    icon: Presentation,
    title: "Educator",
    description:
      "Create quizzes, manage classrooms, assign homework, and track student progress in real time.",
    perks: [
      "Build interactive quizzes",
      "Manage live quiz sessions",
      "View student analytics",
    ],
    gradient: "from-indigo-500 to-purple-600",
    activeBg: "bg-indigo-500/10 border-indigo-500",
    activeIcon: "bg-gradient-to-br from-indigo-500 to-purple-600 text-white",
  },
  {
    value: "student" as const,
    icon: GraduationCap,
    title: "Student",
    description:
      "Join live quizzes, submit class assignments, and track your own performance and scores.",
    perks: ["Join quizzes with a code", "Submit assignments", "Track your progress"],
    gradient: "from-emerald-500 to-teal-600",
    activeBg: "bg-emerald-500/10 border-emerald-500",
    activeIcon: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
  },
];

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<"student" | "educator" | null>(null);
  const [rollNumber, setRollNumber] = useState("");
  const { mutate: updateRole, isPending } = useUpdateRole();
  const router = useRouter();

  const handleConfirm = () => {
    if (!selectedRole) return;
    if (selectedRole === "student" && !rollNumber.trim()) {
      toast.error("Please enter your Roll Number.");
      return;
    }
    updateRole(
      { role: selectedRole, rollNumber: selectedRole === "student" ? rollNumber.trim() : undefined },
      {
        onSuccess: () => {
          toast.success(`Welcome! Your account is set up as ${selectedRole}.`);
          router.push("/dashboard");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to set role. Please try again.");
        },
      }
    );
  };

  const canContinue =
    !!selectedRole &&
    !isPending &&
    (selectedRole === "educator" || (selectedRole === "student" && rollNumber.trim().length > 0));

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-6">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-2 px-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg mb-3">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome to Arun
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Tell us how you'll be using the platform so we can personalize your experience.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;
            return (
              <Card
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={cn(
                  "cursor-pointer transition-all duration-200 border-2 relative overflow-hidden select-none",
                  isSelected
                    ? role.activeBg
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 shrink-0",
                        isSelected ? role.activeIcon : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{role.title}</CardTitle>
                    <CardDescription className="mt-1 text-sm leading-relaxed">
                      {role.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1.5">
                    {role.perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Roll Number — only shown when student is selected */}
        {selectedRole === "student" && (
          <div className="space-y-2 bg-muted/30 px-4 py-5 sm:p-6 rounded-2xl border border-border animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="h-4 w-4 text-primary" />
              <Label htmlFor="rollNumber" className="text-sm font-semibold text-foreground">
                Roll Number / Student ID <span className="text-destructive">*</span>
              </Label>
            </div>
            <Input
              id="rollNumber"
              placeholder="e.g. CS-2023-045"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="h-11 text-sm sm:text-base"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Your roll number is required to join classrooms and submit assignments.
            </p>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleConfirm}
          disabled={!canContinue}
          className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold gap-2"
          size="lg"
        >
          {isPending ? (
            "Setting up your account..."
          ) : selectedRole ? (
            <>
              Continue as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            "Select a role to continue"
          )}
        </Button>
      </div>
    </div>
  );
}
