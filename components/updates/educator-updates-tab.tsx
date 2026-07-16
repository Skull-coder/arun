"use client";

import { useState, useRef, useEffect } from "react";
import { useGetUpdates } from "@/hooks/tanstackQuery/update/use-get-updates";
import { usePushUpdate } from "@/hooks/tanstackQuery/update/use-push-update";
import { useDeleteUpdate } from "@/hooks/tanstackQuery/update/use-delete-update";
import { useEditUpdate } from "@/hooks/tanstackQuery/update/use-edit-update";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Send, Megaphone } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { UpdateMessage } from "./update-message";

export function EducatorUpdatesTab({ classroomId }: { classroomId: number }) {
  const { data, isLoading } = useGetUpdates(classroomId, true);
  const pushUpdate = usePushUpdate();
  const deleteUpdate = useDeleteUpdate();
  const editUpdate = useEditUpdate();

  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on load if we have updates
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
  // Sort oldest first for a chat-like messaging flow
  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const handleSend = () => {
    if (!message.trim()) return;
    pushUpdate.mutate({ classroomId, content: message.trim() }, {
      onSuccess: () => {
        setMessage("");
        // Give the DOM a moment to render the optimistic update then scroll
        setTimeout(() => {
          endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    });
  };

  const handleEditSave = (id: number) => {
    if (!editContent.trim()) return;
    editUpdate.mutate({ classroomId, updateId: id, content: editContent.trim() }, {
      onSuccess: () => setEditingId(null)
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Announcements
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Broadcast updates to your classroom.</p>
        </div>
      </div>

      {/* Feed (Messages) */}
      <div className="flex-1 space-y-6 pb-6">
        {sortedUpdates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 rounded-2xl border border-dashed border-border">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Megaphone className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-semibold">No announcements yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start typing below to notify your students.</p>
            </div>
          </div>
        ) : (
          sortedUpdates.map((u) => (
            <UpdateMessage
              key={u.id}
              update={u}
              classroomId={classroomId}
              canEdit={true}
              isEditing={editingId === u.id}
              editContent={editContent}
              onEditContentChange={setEditContent}
              onStartEdit={() => {
                setEditingId(u.id);
                setEditContent(u.content);
              }}
              onEditCancel={() => setEditingId(null)}
              onEditSave={() => handleEditSave(u.id)}
              onDelete={() => deleteUpdate.mutate({ classroomId, updateId: u.id })}
              isSaving={editUpdate.isPending}
              ctaHref={
                u.isSystem && u.referenceType === "test" && u.referenceId
                  ? `/dashboard/classroom/${classroomId}/test/${u.referenceId}`
                  : undefined
              }
              ctaLabel={
                u.isSystem && u.referenceType === "test" && u.referenceId
                  ? "View Test"
                  : undefined
              }
            />
          ))
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Sticky Composer at bottom */}
      <div className="sticky bottom-0 -mx-4 px-4 pb-2 pt-6 bg-gradient-to-t from-background via-background to-transparent mt-auto">
        <div className="bg-card border border-border rounded-2xl shadow-lg focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all p-2 relative overflow-hidden">
          <Textarea 
            placeholder="Type an announcement... (Press Enter to send, Shift+Enter for new line)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] max-h-[250px] border-none bg-transparent focus-visible:ring-0 resize-none pr-14 text-[15px]"
          />
          <div className="absolute bottom-3 right-3">
            <Button 
              size="icon" 
              className="h-9 w-9 rounded-full shadow-sm"
              disabled={!message.trim() || pushUpdate.isPending}
              onClick={handleSend}
            >
              {pushUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
