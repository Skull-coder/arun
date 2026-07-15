"use client";

import { useGetClassroom } from "@/hooks/tanstackQuery/classroom/use-get-classroom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function StudentPeopleTab({ classroomId }: { classroomId: number }) {
  const { data, isLoading, error } = useGetClassroom(classroomId);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-destructive font-medium text-center mt-10">Failed to load people.</div>;
  }

  const { educator, members } = data;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      
      {/* ─── EDUCATOR ─── */}
      <section>
        <h3 className="text-xl font-bold mb-4 text-primary">Educator</h3>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${educator.firstName} ${educator.lastName}`} />
            <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-semibold text-lg">{educator.firstName} {educator.lastName}</h4>
          </div>
        </div>
      </section>

      {/* ─── CLASSMATES ─── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground">Classmates</h3>
          <span className="text-sm text-muted-foreground font-medium bg-muted px-3 py-1 rounded-full">
            {members.length} {members.length === 1 ? "student" : "students"}
          </span>
        </div>
        
        {members.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 flex items-center justify-center text-muted-foreground text-sm shadow-sm">
            You are the only student here right now!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((m: any) => {
              const name = [m.student.firstName, m.student.lastName].filter(Boolean).join(" ") || "Unknown Student";
              return (
                <div key={m.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <Avatar className="h-10 w-10 border border-border bg-muted">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{name}</h4>
                    {m.student.rollNumber && (
                      <p className="text-xs text-muted-foreground truncate">{m.student.rollNumber}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
