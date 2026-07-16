"use client";

import { format } from "date-fns";
import { Bot, MoreVertical, Edit2, Trash2, Loader2, Pencil } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UpdateMessageProps {
  update: any;
  classroomId: number;
  isNew?: boolean;
  /** Pass true on the Educator's page so edit/delete controls appear */
  canEdit?: boolean;
  isEditing?: boolean;
  editContent?: string;
  onEditContentChange?: (v: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
  onStartEdit?: () => void;
  onDelete?: () => void;
  isSaving?: boolean;
  /** Link for the CTA button — differs between educator and student views */
  ctaHref?: string;
  ctaLabel?: string;
}

export function UpdateMessage({
  update,
  classroomId,
  isNew,
  canEdit,
  isEditing,
  editContent,
  onEditContentChange,
  onEditSave,
  onEditCancel,
  onStartEdit,
  onDelete,
  isSaving,
  ctaHref,
  ctaLabel,
}: UpdateMessageProps) {
  // ── System Automated banner (centered pill style) ──────────────────────────
  if (update.isSystem) {
    return (
      <div className="relative my-2">
        {/* "New" badge */}
        {isNew && (
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full shadow">
            New
          </span>
        )}
        <div
          className={cn(
            "flex flex-col sm:flex-row items-center gap-3 rounded-2xl border px-4 py-4 sm:px-6 transition-all",
            isNew
              ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
              : "border-border bg-muted/30"
          )}
        >
          {/* Bot icon */}
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 shrink-0">
            <Bot className="h-5 w-5 text-primary" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
              <span className="font-semibold text-primary text-sm">System Automated</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(update.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{update.content}</p>
          </div>

          {/* CTA */}
          {ctaHref && ctaLabel && (
            <Button asChild size="sm" className="shrink-0 rounded-full px-5">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Regular educator announcement card ────────────────────────────────────
  return (
    <div
      className={cn(
        "group relative flex gap-3 sm:gap-4 rounded-2xl border p-4 sm:p-5 transition-all",
        isNew
          ? "border-primary/25 bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card hover:border-primary/20 hover:shadow-sm"
      )}
    >
      {/* Avatar — always on the LEFT */}
      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm mt-0.5">
        ED
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm text-foreground">Educator</span>
              {isNew && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  New
                </span>
              )}
              {update.isEdited && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                  <Pencil className="h-2.5 w-2.5" /> edited
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(update.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

          {/* 3-dot menu — only for educator who can edit */}
          {canEdit && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 -mt-0.5 hover:bg-muted"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={onStartEdit} className="gap-2 cursor-pointer">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Body — editable or read-only */}
        {isEditing ? (
          <div className="mt-2 rounded-xl border border-primary/30 bg-background p-3 focus-within:border-primary transition-colors shadow-sm">
            <Textarea
              value={editContent}
              onChange={(e) => onEditContentChange?.(e.target.value)}
              className="min-h-[80px] border-none focus-visible:ring-0 p-0 resize-none shadow-none text-sm"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-border/50">
              <Button variant="ghost" size="sm" onClick={onEditCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={onEditSave} disabled={isSaving} className="gap-1.5">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap mt-1">
            {update.content}
          </p>
        )}
      </div>
    </div>
  );
}
