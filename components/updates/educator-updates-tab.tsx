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
import { Loader2, Send, MoreVertical, Edit2, Trash2, Bot, BellRing } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function EducatorUpdatesTab({ classroomId }: { classroomId: number }) {
  // Fetch with markAsRead = true because the educator is opening the tab
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
  // Sort oldest first for a chat-like flow
  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const handleSend = () => {
    if (!message.trim()) return;
    pushUpdate.mutate({ classroomId, content: message.trim() }, {
      onSuccess: () => setMessage("")
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
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <BellRing className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg leading-none">Classroom Announcements</h3>
          <p className="text-xs text-muted-foreground mt-1">Broadcast updates to all your students instantly.</p>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
        {sortedUpdates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
              <Send className="h-6 w-6 opacity-50" />
            </div>
            <p>No announcements yet.</p>
            <p className="text-sm">Start typing below to notify your students.</p>
          </div>
        ) : (
          sortedUpdates.map((u) => {
            const isSystem = u.isSystem;
            const isEditing = editingId === u.id;

            if (isSystem) {
              return (
                <div key={u.id} className="flex justify-center my-6">
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
                          <Link href={`/dashboard/classroom/${classroomId}/test/${u.referenceId}`}>
                            View Test
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={u.id} className="flex gap-4">
                {/* Avatar (Placeholder for Educator) */}
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 shadow-md flex items-center justify-center text-white font-bold text-sm">
                  ED
                </div>
                
                <div className="group flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">You</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(u.createdAt), "MMM d, p")}
                    </span>
                    {u.isEdited && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                        Edited
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {isEditing ? (
                      <div className="flex-1 bg-background border border-primary/30 rounded-xl p-3 shadow-sm focus-within:border-primary transition-colors">
                        <Textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[80px] border-none focus-visible:ring-0 p-0 resize-none shadow-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
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
                      <div className="relative bg-background border border-border rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm text-sm whitespace-pre-wrap flex-1 hover:border-primary/30 transition-colors">
                        {u.content}
                      </div>
                    )}

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
                </div>
              </div>
            );
          })
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border">
        <div className="relative bg-muted/50 border border-border rounded-2xl focus-within:bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          <Textarea 
            placeholder="Type an announcement to your students... (Press Enter to send, Shift+Enter for new line)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] max-h-[200px] border-none bg-transparent focus-visible:ring-0 resize-none pr-14 py-3 pb-8"
          />
          <Button 
            size="icon" 
            className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
            disabled={!message.trim() || pushUpdate.isPending}
            onClick={handleSend}
          >
            {pushUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
