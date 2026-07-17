"use client";

import { useRef, useEffect } from "react";
import { useGetUpdates } from "@/hooks/tanstackQuery/update/use-get-updates";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles, Megaphone, Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { UpdateMessage } from "./update-message";

export function StudentUpdatesTab({ classroomId }: { classroomId: number }) {
  // Fetch with markAsRead = true
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetUpdates(classroomId, true);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { ref: observerRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  // Auto-scroll to bottom on load
  const initialLoadRef = useRef(true);
  useEffect(() => {
    if (data?.pages?.[0]?.updates && initialLoadRef.current) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "instant" });
      initialLoadRef.current = false;
    }
  }, [data?.pages?.[0]?.updates?.length]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto h-full flex flex-col justify-end">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const updates = data?.pages?.flatMap(p => p.updates) || [];
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
          <>
            {hasNextPage && (
              <div ref={observerRef} className="py-4 flex justify-center">
                {isFetchingNextPage ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <div className="h-6" />}
              </div>
            )}
            {sortedUpdates.map((u) => {
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

                <UpdateMessage
                  update={u}
                  classroomId={classroomId}
                  isNew={isNew}
                  ctaHref={
                    u.isSystem && u.referenceType === "test" && u.referenceId
                      ? `/dashboard/classroom/${classroomId}/test/${u.referenceId}/lobby`
                      : undefined
                  }
                  ctaLabel={
                    u.isSystem && u.referenceType === "test" && u.referenceId
                      ? "Go to Test"
                      : undefined
                  }
                />
              </div>
            );
          })}
          </>
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
}
