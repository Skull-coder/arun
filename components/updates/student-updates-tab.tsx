"use client";

import { useRef, useEffect } from "react";
import { useGetUpdates } from "@/hooks/tanstackQuery/update/use-get-updates";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bot, BellRing, Sparkles } from "lucide-react";
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
      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.updates?.length]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
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
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3 shadow-sm z-10">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <BellRing className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg leading-none">Updates & Announcements</h3>
          <p className="text-xs text-muted-foreground mt-1">Stay up to date with your classroom.</p>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10 relative">
        {sortedUpdates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
              <Sparkles className="h-6 w-6 opacity-50" />
            </div>
            <p>No announcements yet.</p>
            <p className="text-sm">You are all caught up!</p>
          </div>
        ) : (
          sortedUpdates.map((u) => {
            const createdAtTime = new Date(u.createdAt).getTime();
            const isNew = createdAtTime > oldLastReadAt;

            // Render the "New Updates" divider right before the first new message
            let renderDivider = false;
            if (isNew && !dividerRendered && oldLastReadAt > 0) {
              dividerRendered = true;
              renderDivider = true;
            }

            return (
              <div key={u.id}>
                {renderDivider && (
                  <div className="flex items-center justify-center my-8">
                    <div className="h-px bg-yellow-500/50 flex-1 max-w-[100px]"></div>
                    <span className="mx-4 text-xs font-bold text-yellow-600 bg-yellow-500/10 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                      New Updates
                    </span>
                    <div className="h-px bg-yellow-500/50 flex-1 max-w-[100px]"></div>
                  </div>
                )}

                {u.isSystem ? (
                  <div className="flex justify-center my-6">
                    <div className="bg-primary/5 border border-primary/20 text-primary-foreground rounded-2xl p-5 flex flex-col items-center gap-3 w-full max-w-2xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-semibold text-primary">System Automated</span>
                      </div>
                      <p className="text-foreground/90 text-[15px] text-center leading-relaxed font-medium">
                        {u.content}
                      </p>
                      <div className="flex items-center justify-between w-full mt-2">
                        <span className="text-muted-foreground text-xs font-medium">
                          {format(new Date(u.createdAt), "MMM d, yyyy - p")}
                        </span>
                        {u.referenceType === "test" && u.referenceId && (
                          <Button asChild size="sm" variant="default" className="h-8 shadow-sm">
                            <Link href={`/dashboard/classroom/${classroomId}/test/${u.referenceId}/lobby`}>
                              Go to Test
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 max-w-3xl">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 shadow-md flex items-center justify-center text-white font-bold text-sm">
                      ED
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">Educator</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(u.createdAt), "MMM d, p")}
                        </span>
                        {u.isEdited && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                            Edited
                          </span>
                        )}
                      </div>
                      
                      <div className="bg-background border border-border rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm text-[15px] whitespace-pre-wrap flex-1 hover:border-primary/30 transition-colors">
                        {u.content}
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
