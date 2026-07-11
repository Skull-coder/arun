"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateTest } from "@/hooks/tanstackQuery/test/use-create-test";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ToggleLeft,
  AlignLeft,
  ListOrdered,
  CheckSquare,
  Circle,
  Clock,
  Award,
  Settings2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = "single_choice" | "multi_choice" | "true_false" | "text" | "sequence";

interface LocalOption { id: string; text: string; }

interface LocalQuestion {
  type: QuestionType;
  text: string;
  marks: number;
  config: any;
  correctAnswer: any;
  orderIndex: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultQuestion(type: QuestionType, index: number): LocalQuestion {
  const base = { type, text: "", marks: 4, orderIndex: index };
  switch (type) {
    case "single_choice": return { ...base, config: { options: [{ id: "a", text: "" }, { id: "b", text: "" }] }, correctAnswer: "a" };
    case "multi_choice": return { ...base, config: { options: [{ id: "a", text: "" }, { id: "b", text: "" }] }, correctAnswer: ["a"] };
    case "true_false": return { ...base, marks: 2, config: {}, correctAnswer: true };
    case "text": return { ...base, config: { caseSensitive: false }, correctAnswer: "" };
    case "sequence": return { ...base, marks: 6, config: { items: [{ id: "1", text: "" }, { id: "2", text: "" }] }, correctAnswer: ["1", "2"] };
  }
}

function nextOptionId(options: LocalOption[]): string {
  for (const id of "abcdefghij".split("")) {
    if (!options.find((o) => o.id === id)) return id;
  }
  return String(Date.now());
}

const OPTION_LABELS = "ABCDEFGHIJ".split("");

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ElementType }[] = [
  { value: "single_choice", label: "Single Choice", icon: Circle },
  { value: "multi_choice", label: "Multi Choice", icon: CheckSquare },
  { value: "true_false", label: "True / False", icon: ToggleLeft },
  { value: "text", label: "Text Answer", icon: AlignLeft },
  { value: "sequence", label: "Sequence", icon: ListOrdered },
];

const DURATION_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
  { label: "120 min", value: 120 },
  { label: "180 min", value: 180 },
  { label: "Custom", value: 0 },
];

// ─── Answer Editors ───────────────────────────────────────────────────────────

function ChoiceEditor({ question, multi, onChange }: { question: LocalQuestion; multi: boolean; onChange: (q: LocalQuestion) => void }) {
  const options: LocalOption[] = question.config.options ?? [];
  const correctAnswer = question.correctAnswer;

  const updateOption = (id: string, text: string) => onChange({ ...question, config: { ...question.config, options: options.map((o) => o.id === id ? { ...o, text } : o) } });
  const addOption = () => { if (options.length >= 10) return; const id = nextOptionId(options); onChange({ ...question, config: { ...question.config, options: [...options, { id, text: "" }] } }); };
  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((o) => o.id !== id);
    let newAnswer = correctAnswer;
    if (multi) { newAnswer = (correctAnswer as string[]).filter((a: string) => a !== id); if (newAnswer.length === 0) newAnswer = [newOptions[0]?.id ?? ""]; }
    else { if (correctAnswer === id) newAnswer = newOptions[0]?.id ?? ""; }
    onChange({ ...question, config: { ...question.config, options: newOptions }, correctAnswer: newAnswer });
  };

  if (!multi) {
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">Answer Options <span className="font-normal text-muted-foreground">— select the correct answer</span></Label>
        <RadioGroup value={correctAnswer} onValueChange={(v) => onChange({ ...question, correctAnswer: v })} className="space-y-2">
          {options.map((opt, idx) => (
            <div key={opt.id} className={cn("flex items-center gap-3 rounded-lg border p-3 transition-all", correctAnswer === opt.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40")}>
              <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} className="shrink-0" />
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">{OPTION_LABELS[idx]}</div>
              <Input value={opt.text} onChange={(e) => updateOption(opt.id, e.target.value)} placeholder={`Option ${OPTION_LABELS[idx]}…`} className="flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm" />
              {options.length > 2 && <button onClick={() => removeOption(opt.id)} className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>}
            </div>
          ))}
        </RadioGroup>
        {options.length < 10 && <Button variant="outline" size="sm" className="gap-2" onClick={addOption}><Plus className="h-3.5 w-3.5" />Add Option</Button>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Answer Options <span className="font-normal text-muted-foreground">— check all correct answers</span></Label>
      <div className="space-y-2">
        {options.map((opt, idx) => {
          const isChecked = Array.isArray(correctAnswer) && correctAnswer.includes(opt.id);
          return (
            <div key={opt.id} className={cn("flex items-center gap-3 rounded-lg border p-3 transition-all", isChecked ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40")}>
              <Checkbox id={`opt-${opt.id}`} checked={isChecked} onCheckedChange={(checked) => { const current = Array.isArray(correctAnswer) ? correctAnswer : []; const next = checked ? [...current, opt.id] : current.filter((a) => a !== opt.id); onChange({ ...question, correctAnswer: next.length > 0 ? next : [options[0]?.id ?? ""] }); }} className="shrink-0" />
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">{OPTION_LABELS[idx]}</div>
              <Input value={opt.text} onChange={(e) => updateOption(opt.id, e.target.value)} placeholder={`Option ${OPTION_LABELS[idx]}…`} className="flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm" />
              {options.length > 2 && <button onClick={() => removeOption(opt.id)} className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>}
            </div>
          );
        })}
      </div>
      {options.length < 10 && <Button variant="outline" size="sm" className="gap-2" onClick={addOption}><Plus className="h-3.5 w-3.5" />Add Option</Button>}
    </div>
  );
}

function TrueFalseEditor({ question, onChange }: { question: LocalQuestion; onChange: (q: LocalQuestion) => void }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Correct Answer</Label>
      <div className="flex gap-3">
        {([true, false] as const).map((val) => (
          <button key={String(val)} onClick={() => onChange({ ...question, correctAnswer: val })}
            className={cn("flex flex-1 items-center justify-center rounded-xl border-2 py-10 text-base font-semibold transition-all",
              question.correctAnswer === val ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted")}>
            {val ? "✓  True" : "✗  False"}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextAnswerEditor({ question, onChange }: { question: LocalQuestion; onChange: (q: LocalQuestion) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Correct Answer</Label>
        <Input value={question.correctAnswer} onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })} placeholder="Type the correct answer…" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="case-sensitive" checked={question.config?.caseSensitive ?? false} onCheckedChange={(checked) => onChange({ ...question, config: { ...question.config, caseSensitive: !!checked } })} />
        <Label htmlFor="case-sensitive" className="cursor-pointer text-sm text-muted-foreground">Case-sensitive matching</Label>
      </div>
    </div>
  );
}

function SequenceEditor({ question, onChange }: { question: LocalQuestion; onChange: (q: LocalQuestion) => void }) {
  const items: LocalOption[] = question.config.items ?? [];

  const updateItem = (id: string, text: string) => {
    onChange({
      ...question,
      config: {
        ...question.config,
        items: items.map((i) => (i.id === id ? { ...i, text } : i)),
      },
    });
  };

  const addItem = () => {
    if (items.length >= 20) return;
    const maxId = items.reduce((max, item) => Math.max(max, parseInt(item.id) || 0), 0);
    const newId = String(maxId + 1);
    const newItems = [...items, { id: newId, text: "" }];
    onChange({
      ...question,
      config: { ...question.config, items: newItems },
      correctAnswer: newItems.map((i) => i.id),
    });
  };

  const removeItem = (id: string) => {
    if (items.length <= 2) return;
    const newItems = items.filter((i) => i.id !== id);
    onChange({
      ...question,
      config: { ...question.config, items: newItems },
      correctAnswer: newItems.map((i) => i.id),
    });
  };

  const toggleSequence = (id: string) => {
    let current = Array.isArray(question.correctAnswer) ? [...question.correctAnswer] : items.map(i => i.id);
    if (current.includes(id)) {
      current = current.filter((x) => x !== id);
    } else {
      current.push(id);
    }
    onChange({ ...question, correctAnswer: current });
  };

  const correctAnswer = Array.isArray(question.correctAnswer) ? question.correctAnswer : items.map(i => i.id);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">
        Sequence Items{" "}
        <span className="font-normal text-muted-foreground">(tap the circles to set the correct order)</span>
      </Label>
      {items.map((item) => {
        const indexInOrder = correctAnswer.indexOf(item.id);
        const isSelected = indexInOrder !== -1;
        
        return (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 transition-colors",
              isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
            )}
          >
            <button
              onClick={() => toggleSequence(item.id)}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all active:scale-95",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {isSelected ? indexInOrder + 1 : ""}
            </button>
            <Input
              value={item.text}
              onChange={(e) => updateItem(item.id, e.target.value)}
              placeholder="Type sequence item…"
              className="flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/50"
            />
            {items.length > 2 && (
              <button
                onClick={() => removeItem(item.id)}
                className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
      {items.length < 20 && (
        <Button variant="outline" size="sm" className="gap-2" onClick={addItem}>
          <Plus className="h-3.5 w-3.5" />
          Add Item
        </Button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CreateTestClient({ classroomId }: { classroomId: number }) {
  const router = useRouter();
  const { mutate: createTest, isPending } = useCreateTest();

  // Test settings
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [customDuration, setCustomDuration] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isNegativeMarking, setIsNegativeMarking] = useState(false);

  // Questions
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const activeQuestion = activeIdx !== null ? questions[activeIdx] : null;

  const addQuestion = (type: QuestionType) => {
    const newQ = defaultQuestion(type, questions.length);
    const newQs = [...questions, newQ];
    setQuestions(newQs);
    setActiveIdx(newQs.length - 1);
  };

  const deleteQuestion = (idx: number) => {
    const newQs = questions.filter((_, i) => i !== idx);
    setQuestions(newQs);
    if (activeIdx === idx) setActiveIdx(newQs.length > 0 ? Math.max(0, idx - 1) : null);
    else if (activeIdx !== null && activeIdx > idx) setActiveIdx(activeIdx - 1);
  };

  const updateActive = (updated: LocalQuestion) => {
    setQuestions((prev) => prev.map((q, i) => i === activeIdx ? updated : q));
  };

  const changeType = (type: QuestionType) => {
    if (!activeQuestion) return;
    const fresh = defaultQuestion(type, activeIdx!);
    updateActive({ ...fresh, text: activeQuestion.text });
  };

  const handleSave = () => {
    if (!title.trim()) return toast.error("Title is required");
    if (questions.length === 0) return toast.error("Add at least one question");

    let scheduledDate;
    if (scheduledAt) {
      scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        return toast.error("Scheduled time must be in the future");
      }
    }

    createTest({
      classroomId,
      title: title.trim(),
      description: description.trim() || undefined,
      durationMinutes,
      scheduledAt: scheduledDate,
      isNegativeMarking,
      questions: questions.map((q) => ({
        ...q,
        text: q.text || "Untitled Question",
      })),
    }, {
      onSuccess: () => {
        toast.success("Test created successfully!");
        router.push(`/dashboard/classroom/${classroomId}`);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── LEFT: Question List ── */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href={`/dashboard/classroom/${classroomId}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <span className="flex-1 font-semibold text-sm">Questions</span>
          <Badge variant="secondary" className="text-xs">{questions.length}</Badge>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No questions yet. Add one below.</p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const TypeIcon = QUESTION_TYPES.find((t) => t.value === q.type)?.icon ?? Circle;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={cn(
                    "group flex cursor-pointer items-center gap-2 border-l-2 px-3 py-2.5 transition-all",
                    activeIdx === idx
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:bg-muted"
                  )}
                >
                  <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold",
                    activeIdx === idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {idx + 1}
                  </div>
                  <TypeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className={cn("flex-1 truncate text-xs", activeIdx === idx ? "font-medium text-primary" : "text-foreground")}>
                    {q.text.trim() || <span className="italic text-muted-foreground">Untitled</span>}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); deleteQuestion(idx); }}
                    className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive group-hover:flex">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <Separator />
        <div className="p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add Question</p>
          <div className="grid grid-cols-5 gap-1">
            {QUESTION_TYPES.map((qt) => {
              const Icon = qt.icon;
              return (
                <button key={qt.value} onClick={() => addQuestion(qt.value)} title={qt.label}
                  className="flex items-center justify-center rounded-md border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── CENTER: Question Editor ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeQuestion ? (
          <>
            {/* Sticky top bar */}
            <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-card/95 px-6 py-3 backdrop-blur">
              <Select value={activeQuestion.type} onValueChange={(v) => changeType(v as QuestionType)}>
                <SelectTrigger className="w-44 text-sm h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((qt) => (
                    <SelectItem key={qt.value} value={qt.value}>{qt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-muted-foreground" />
                <Input type="number" min={1} value={activeQuestion.marks}
                  onChange={(e) => updateActive({ ...activeQuestion, marks: Number(e.target.value) })}
                  className="w-20 h-8 text-sm" />
                <span className="text-xs text-muted-foreground">marks</span>
              </div>

              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <span>Q{(activeIdx ?? 0) + 1} / {questions.length}</span>
              </div>
            </div>

            {/* Editor body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Question</Label>
                <Textarea
                  value={activeQuestion.text}
                  onChange={(e) => updateActive({ ...activeQuestion, text: e.target.value })}
                  placeholder="Type your question here…"
                  className="min-h-[120px] resize-none text-base leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Answer Configuration</Label>
                {activeQuestion.type === "single_choice" && <ChoiceEditor question={activeQuestion} multi={false} onChange={updateActive} />}
                {activeQuestion.type === "multi_choice" && <ChoiceEditor question={activeQuestion} multi={true} onChange={updateActive} />}
                {activeQuestion.type === "true_false" && <TrueFalseEditor question={activeQuestion} onChange={updateActive} />}
                {activeQuestion.type === "text" && <TextAnswerEditor question={activeQuestion} onChange={updateActive} />}
                {activeQuestion.type === "sequence" && <SequenceEditor question={activeQuestion} onChange={updateActive} />}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              {questions.length === 0 ? "Add a question to get started" : "Select a question from the left"}
            </p>
            {questions.length === 0 && (
              <Button variant="outline" onClick={() => addQuestion("single_choice")} className="gap-2 mt-2">
                <Plus className="h-4 w-4" /> Add First Question
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: Test Settings ── */}
      <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Test Settings</span>
        </div>

        <div className="flex-1 p-4 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Physics Unit 1 Test" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description or instructions…" rows={3} className="resize-none" />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Duration
            </Label>
            <Select
              value={customDuration ? "0" : String(durationMinutes)}
              onValueChange={(v) => {
                if (v === "0") { setCustomDuration(true); }
                else { setCustomDuration(false); setDurationMinutes(Number(v)); }
              }}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {customDuration && (
              <div className="flex items-center gap-2 mt-2">
                <Input type="number" min={5} max={1440} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="text-sm" />
                <span className="text-xs text-muted-foreground shrink-0">minutes</span>
              </div>
            )}
          </div>

          {/* Scheduled At */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Schedule At</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="text-sm" />
          </div>

          {/* Negative Marking */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div className="space-y-0.5">
              <Label className="text-sm">Negative Marking</Label>
              <p className="text-xs text-muted-foreground">-1 for incorrect answers</p>
            </div>
            <Switch checked={isNegativeMarking} onCheckedChange={setIsNegativeMarking} />
          </div>

          <Separator />

          {/* Summary */}
          <div className="rounded-lg bg-muted p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Questions</span>
                <span className="font-semibold">{questions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Marks</span>
                <span className="font-semibold">{totalMarks}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Neg. Marking</span>
                <span className="font-semibold">{isNegativeMarking ? "Yes (-1)" : "No"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-semibold">{durationMinutes} min</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <Button onClick={handleSave} disabled={isPending} className="w-full h-11 text-sm font-semibold">
            {isPending ? "Creating Test…" : "Create Test"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
