"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { SignOutButton } from "@clerk/nextjs";
import { useUpdateProfile } from "@/hooks/tanstackQuery/user/use-update-profile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Settings,
  Hash,
  User,
  Mail,
  Save,
  X,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  icon: React.ElementType;
  active?: boolean;
  soon?: boolean;
  onClick?: () => void;
}

interface AppUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string | null;
  rollNumber?: string | null;
}

interface AppSidebarProps {
  user: AppUser;
  navItems: NavItem[];
  /** Extra slot rendered below nav (e.g. a "Create Quiz" shortcut) */
  children?: React.ReactNode;
}

// ─── Theme Toggle Buttons ─────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={cn(
            "flex flex-1 items-center justify-center rounded-md p-1.5 text-xs transition-colors",
            theme === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

// ─── Settings Dialog ──────────────────────────────────────────────────────────

function SettingsDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: AppUser;
}) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [rollNumber, setRollNumber] = useState(user.rollNumber ?? "");
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  useEffect(() => {
    if (open) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setRollNumber(user.rollNumber ?? "");
    }
  }, [open, user.firstName, user.lastName, user.rollNumber]);

  const handleSave = () => {
    if (!firstName.trim()) {
      toast.error("First name is required.");
      return;
    }
    updateProfile(
      { firstName: firstName.trim(), lastName: lastName.trim() || undefined, rollNumber: rollNumber.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Settings saved!");
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message || "Failed to save."),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Update your profile details. Your roll number helps educators identify you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="s-firstName"
                  className="pl-9 h-9"
                  placeholder="First"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-lastName">Last Name</Label>
              <Input
                id="s-lastName"
                className="h-9"
                placeholder="Last (optional)"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {user.role === "student" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-rollNumber">Roll Number</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="s-rollNumber"
                  className="pl-9 h-9 font-mono"
                  placeholder="e.g. 12345678"
                  value={rollNumber}
                  maxLength={20}
                  onChange={(e) => setRollNumber(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Up to 20 characters. Shown on leaderboards so educators can identify you.
              </p>
            </div>
          )}

          {/* Appearance */}
          <div className="flex flex-col gap-2 pt-1">
            <Label>Appearance</Label>
            <ThemeToggle />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !firstName.trim()} className="gap-2">
            <Save className="h-4 w-4" />
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── User Popover ─────────────────────────────────────────────────────────────

function UserPopover({
  user,
  collapsed,
  onSettings,
}: {
  user: AppUser;
  collapsed: boolean;
  onSettings: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger — avatar + name */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted",
          open && "bg-muted"
        )}
      >
        {/* Avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {initials}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
          </div>
        )}
      </button>

      {/* Popover panel — appears above the trigger */}
      {open && (
        <div
          className={cn(
            "absolute z-50 w-72 rounded-xl border border-border bg-card shadow-xl",
            // Position: above trigger, aligned left when expanded, right when collapsed
            "bottom-full mb-2",
            collapsed ? "-right-2" : "left-0"
          )}
        >
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="absolute right-2.5 top-2.5 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* User card */}
          <div className="p-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm leading-tight">{displayName}</p>
                <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0 capitalize">
                  {user.role ?? "user"}
                </Badge>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.rollNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium text-foreground/60">Roll No:</span>
                  <span className="font-mono">{user.rollNumber}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Appearance row */}
          <div className="px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Appearance
            </p>
            <ThemeToggle />
          </div>

          <Separator />

          {/* Actions */}
          <div className="p-2 space-y-0.5">
            <button
              onClick={() => { setOpen(false); onSettings(); }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              Settings
            </button>
            <SignOutButton>
              <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App Sidebar ──────────────────────────────────────────────────────────────

export function AppSidebar({ user, navItems, children }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex relative shrink-0 flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
          collapsed ? "w-[60px]" : "w-60"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-3 py-4 overflow-hidden",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
            <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-card-foreground whitespace-nowrap">
              EduQuiz
            </span>
          )}
        </div>

        <Separator />

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.soon && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 leading-tight">
                        Soon
                      </Badge>
                    )}
                  </>
                )}
              </button>
            );
          })}

          {/* Extra slot */}
          {!collapsed && children}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-[52px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>

        <Separator />

        {/* User popover trigger area */}
        <div className="p-2">
          <UserPopover
            user={user}
            collapsed={collapsed}
            onSettings={() => setSettingsOpen(true)}
          />
        </div>
      </aside>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
      />
    </>
  );
}

// ─── Mobile App Sidebar ───────────────────────────────────────────────────────

export function MobileAppSidebar({ user, navItems, children }: AppSidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col bg-card">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-6 py-5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-card-foreground">
              EduQuiz
            </span>
          </div>

          <Separator />

          {/* Nav */}
          <nav className="flex-1 space-y-1.5 px-4 py-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                    item.active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.soon && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 leading-tight">
                      Soon
                    </Badge>
                  )}
                </button>
              );
            })}

            {/* Extra slot */}
            <div className="pt-2">{children}</div>
          </nav>

          <Separator />

          {/* User popover trigger area */}
          <div className="p-4">
            <UserPopover
              user={user}
              collapsed={false}
              onSettings={() => {
                setOpen(false);
                setSettingsOpen(true);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
      />
    </>
  );
}
