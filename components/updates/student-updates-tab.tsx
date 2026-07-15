"use client";

import { useRef, useEffect } from "react";
import { useGetUpdates } from "@/hooks/tanstackQuery/update/use-get-updates";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Megaphone } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function StudentUpdatesTab({ classroomId }: { classroomId: number }) {
  // Fetch with markAsRead = true
  const { data, isLoading } = useGetUpdates(classroomId, true);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on load
  useEffect(() => {
    if (data?.updates) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [data?.updates?.length]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto h-full flex flex-col justify-end">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const updates = data?.updates || [];
  // The backend returned the lastReadAt from *before* it marked them as read in this request.
  const oldLastReadAt = data?.lastReadAt ? new Date(data.lastReadAt).getTime() : 0;
  
  // Sort oldest first for chat flow
  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let dividerRendered = false;

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Updates & Announcements
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Stay up to date with your classroom.</p>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 space-y-6 pb-12">
        {sortedUpdates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 rounded-2xl border border-dashed border-border">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-semibold">No announcements yet</p>
              <p className="text-sm text-muted-foreground mt-1">You are all caught up!</p>
            </div>
          </div>
        ) : (
          sortedUpdates.map((u) => {
            const createdAtTime = new Date(u.createdAt).getTime();
            const isNew = createdAtTime > oldLastReadAt;

            // Render the "New Updates" divider right before the first new message (going downwards)
            let renderDivider = false;
            if (isNew && !dividerRendered && oldLastReadAt > 0) {
              dividerRendered = true;
              renderDivider = true;
            }

            return (
              <div key={u.id}>
                {renderDivider && (
                  <div className="flex items-center justify-center my-8">
                    <div className="h-px bg-yellow-500/50 flex-1"></div>
                    <span className="mx-4 text-xs font-bold text-yellow-600 bg-yellow-500/10 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                      New Updates
                    </span>
                    <div className="h-px bg-yellow-500/50 flex-1"></div>
                  </div>
                )}

                {u.isSystem ? (
                  <div className={cn(
                    "bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all max-w-3xl mx-auto w-full",
                    isNew ? "ring-2 ring-primary/20" : ""
                  )}>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">System Automated</span>
                          {isNew && <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">New</span>}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {format(new Date(u.createdAt), "MMM d, p")}
                        </span>
                      </div>
                      <p className="text-[15px] leading-relaxed text-foreground/90 mt-2 text-center">
                        {u.content}
                      </p>
                      {u.referenceType === "test" && u.referenceId && (
                        <div className="flex justify-center mt-4">
                          <Button asChild size="sm" variant="default" className="shadow-sm">
                            <Link href={`/dashboard/classroom/${classroomId}/test/${u.referenceId}/lobby`}>
                              Go to Test
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    "bg-card border border-border rounded-2xl p-6 shadow-sm transition-all",
                    isNew ? "ring-2 ring-primary/20" : ""
                  )}>
                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 flex items-center justify-center text-white font-bold text-sm">
                        ED
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Educator</span>
                              {isNew && <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">New</span>}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              {format(new Date(u.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              {u.isEdited && (
                                <span className="bg-muted px-1.5 py-0.5 rounded-sm">Edited</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-[15px] whitespace-pre-wrap leading-relaxed mt-2">
                          {u.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
}
