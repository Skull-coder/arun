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
import { GraduationCap, Presentation, CheckCircle2 } from "lucide-react";
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
  },
  {
    value: "student" as const,
    icon: GraduationCap,
    title: "Student",
    description:
      "Join live quizzes, submit class assignments, and track your own performance and scores.",
    perks: ["Join quizzes with a code", "Submit assignments", "Track your progress"],
  },
];

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<"student" | "educator" | null>(null);
  const { mutate: updateRole, isPending } = useUpdateRole();
  const router = useRouter();

  const handleConfirm = () => {
    if (!selectedRole) return;
    updateRole(
      { role: selectedRole },
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Welcome to EduQuiz
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell us how you will be using the platform so we can personalize your experience.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;
            return (
              <Card
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={cn(
                  "cursor-pointer transition-all duration-200 border-2",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{role.title}</CardTitle>
                    <CardDescription className="mt-1.5 text-sm leading-relaxed">
                      {role.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {role.perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button
          onClick={handleConfirm}
          disabled={!selectedRole || isPending}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {isPending
            ? "Setting up your account..."
            : selectedRole
            ? `Continue as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
            : "Select a role to continue"}
        </Button>
      </div>
    </div>
  );
}
