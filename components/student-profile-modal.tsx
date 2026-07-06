"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProfile } from "@/hooks/tanstackQuery/user/use-update-profile";
import { toast } from "sonner";
import { User, Hash, Save } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    firstName: string | null;
    lastName: string | null;
    rollNumber: string | null;
  };
}

export function StudentProfileModal({ open, onOpenChange, user }: Props) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [rollNumber, setRollNumber] = useState(user.rollNumber ?? "");

  const { mutate: updateProfile, isPending } = useUpdateProfile();

  // Pre-fill inputs whenever the dialog opens or user prop changes
  useEffect(() => {
    if (open) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setRollNumber(user.rollNumber ?? "");
    }
  }, [open, user.firstName, user.lastName, user.rollNumber]);

  const handleSave = () => {
    updateProfile(
      { firstName, lastName, rollNumber: rollNumber || undefined },
      {
        onSuccess: () => {
          toast.success("Profile updated!");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your name and roll number. Your roll number helps educators
            identify you in leaderboards.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* First Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName">
              First Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="firstName"
                className="pl-9"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastName">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="lastName"
                className="pl-9"
                placeholder="Last name (optional)"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Roll Number */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rollNumber">Roll Number</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="rollNumber"
                className="pl-9 font-mono"
                placeholder="e.g. 12345678"
                value={rollNumber}
                maxLength={20}
                onChange={(e) => setRollNumber(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Up to 20 characters. Letters, numbers, hyphens and underscores only.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !firstName.trim()} className="gap-2">
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
