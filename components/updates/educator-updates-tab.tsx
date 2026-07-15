"use client";

import { useState, useRef, useEffect } from "react";
import { useGetUpdates } from "@/hooks/tanstackQuery/update/use-get-updates";
import { usePushUpdate } from "@/hooks/tanstackQuery/update/use-push-update";
import { useDeleteUpdate } from "@/hooks/tanstackQuery/update/use-delete-update";
import { useEditUpdate } from "@/hooks/tanstackQuery/update/use-edit-update";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Loader2, Send, MoreVertical, Edit2, Trash2, Bot, Megaphone } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

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
          sortedUpdates.map((u) => {
            const isSystem = u.isSystem;
            const isEditing = editingId === u.id;

            if (isSystem) {
              return (
                <div key={u.id} className="flex justify-center my-6">
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4 shadow-sm max-w-3xl w-full">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-primary">System Automated</span>
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
                            <Link href={`/dashboard/classroom/${classroomId}/test/${u.referenceId}`}>
                              View Test
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={u.id} className="group bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-colors">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 flex items-center justify-center text-white font-bold text-sm">
                    ED
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="mb-2">
                        <div className="font-semibold">You</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {format(new Date(u.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          {u.isEdited && (
                            <span className="bg-muted px-1.5 py-0.5 rounded-sm">Edited</span>
                          )}
                        </div>
                      </div>

                      {!isEditing && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingId(u.id);
                                setEditContent(u.content);
                              }}>
                                <Edit2 className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => deleteUpdate.mutate({ classroomId, updateId: u.id })}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="bg-background border border-primary/30 rounded-xl p-3 mt-2 shadow-sm focus-within:border-primary transition-colors">
                        <Textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[100px] border-none focus-visible:ring-0 p-0 resize-none shadow-none text-base"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border/50">
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleEditSave(u.id)}
                            disabled={editUpdate.isPending}
                          >
                            {editUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[15px] whitespace-pre-wrap leading-relaxed">
                        {u.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
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
