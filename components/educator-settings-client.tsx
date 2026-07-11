"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useGetClassroom } from "@/hooks/tanstackQuery/classroom/use-get-classroom";
import { useUpdateClassroom } from "@/hooks/tanstackQuery/classroom/use-update-classroom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Check, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function EducatorSettingsClient({ classroomId }: { classroomId: number }) {
  const { data, isLoading } = useGetClassroom(classroomId);
  const { mutate: updateClassroom, isPending: isUpdating } = useUpdateClassroom();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isAccepting, setIsAccepting] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data?.classroom) {
      setName(data.classroom.name);
      setDescription(data.classroom.description || "");
      setIsAccepting(data.classroom.isAcceptingRequests);
    }
  }, [data]);

  if (isLoading) return <Skeleton className="w-full h-96" />;
  const classroom = data?.classroom;
  if (!classroom) return null;

  const copyCode = () => {
    if (!classroom?.joinCode) return;
    navigator.clipboard.writeText(classroom.joinCode);
    setCopied(true);
    toast.success("Join code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = () => {
    if (!name.trim()) return toast.error("Classroom name is required");
    updateClassroom(
      { id: classroomId, data: { name, description, isAcceptingRequests: isAccepting } },
      { onSuccess: () => toast.success("Settings saved successfully!") }
    );
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Join Code</h3>
        <p className="text-sm text-muted-foreground mb-4">Share this code with students so they can request to join.</p>
        <div className="flex items-center gap-4">
          <code className="rounded bg-muted px-3 py-1.5 text-lg font-mono font-bold tracking-widest text-primary border border-border">
            {classroom.joinCode}
          </code>
          <Button variant="outline" onClick={copyCode} className="gap-2">
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy Code"}
          </Button>
        </div>
      </div>
      
      <Separator />

      <div>
        <h3 className="text-lg font-semibold">Classroom Details</h3>
        <p className="text-sm text-muted-foreground mb-4">Update your classroom information and enrollment settings.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Classroom Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Accepting Requests</Label>
            <p className="text-sm text-muted-foreground">
              Allow new students to request to join using the join code.
            </p>
          </div>
          <Switch
            checked={isAccepting}
            onCheckedChange={setIsAccepting}
          />
        </div>
      </div>

      <div className="flex justify-start pt-4 mt-6">
        <Button onClick={handleSaveSettings} disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
