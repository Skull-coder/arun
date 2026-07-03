"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateQuiz } from "@/hooks/tanstackQuery/quiz/use-create-quiz";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Award,
  ChevronRight,
  CheckSquare,
  Type,
  ToggleLeft,
  ListOrdered,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocalOption {
  id: string;
  text: string;
}

interface LocalQuestion {
  type: "single_choice" | "multi_choice" | "true_false" | "text" | "sequence";
  text: string;
  durationSeconds: number;
  marks: number;
  config: any;
  correctAnswer: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultQuestion(type: LocalQuestion["type"]): LocalQuestion {
  switch (type) {
    case "single_choice":
      return {
        type,
        text: "",
        durationSeconds: 30,
        marks: 10,
        config: { options: [{ id: "a", text: "" }, { id: "b", text: "" }] },
        correctAnswer: "a",
      };
    case "multi_choice":
      return {
        type,
        text: "",
        durationSeconds: 30,
        marks: 10,
        config: { options: [{ id: "a", text: "" }, { id: "b", text: "" }] },
        correctAnswer: ["a"],
      };
    case "true_false":
      return { type, text: "", durationSeconds: 20, marks: 5, config: {}, correctAnswer: true };
    case "text":
      return {
        type,
        text: "",
        durationSeconds: 60,
        marks: 10,
        config: { caseSensitive: false },
        correctAnswer: "",
      };
    case "sequence":
      return {
        type,
        text: "",
        durationSeconds: 60,
        marks: 15,
        config: { items: [{ id: "1", text: "" }, { id: "2", text: "" }] },
        correctAnswer: ["1", "2"],
      };
  }
}

const QUESTION_TYPES: { value: LocalQuestion["type"]; label: string; icon: React.ElementType }[] = [
  { value: "single_choice", label: "Single Choice", icon: ChevronRight },
  { value: "multi_choice", label: "Multi Choice", icon: CheckSquare },
  { value: "true_false", label: "True / False", icon: ToggleLeft },
  { value: "text", label: "Text Answer", icon: Type },
  { value: "sequence", label: "Sequence", icon: ListOrdered },
];

const DURATIONS = [5, 10, 20, 30, 45, 60, 90, 120, 180, 300];
const OPTION_LABELS = "ABCDEFGHIJ".split("");

function nextOptionId(options: LocalOption[]): string {
  for (const id of "abcdefghij".split("")) {
    if (!options.find((o) => o.id === id)) return id;
  }
  return String(Date.now());
}

// ─── Sub-editors ──────────────────────────────────────────────────────────────

function ChoiceEditor({
  question,
  multi,
  onChange,
}: {
  question: LocalQuestion;
  multi: boolean;
  onChange: (q: LocalQuestion) => void;
}) {
  const options: LocalOption[] = question.config.options ?? [];
  const correctAnswer: any = question.correctAnswer;

  const updateOption = (id: string, text: string) => {
    onChange({
      ...question,
      config: {
        ...question.config,
        options: options.map((o) => (o.id === id ? { ...o, text } : o)),
      },
    });
  };

  const addOption = () => {
    if (options.length >= 10) return;
    const id = nextOptionId(options);
    onChange({
      ...question,
      config: { ...question.config, options: [...options, { id, text: "" }] },
    });
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((o) => o.id !== id);
    let newAnswer = correctAnswer;
    if (multi) {
      newAnswer = (correctAnswer as string[]).filter((a: string) => a !== id);
      if (newAnswer.length === 0) newAnswer = [newOptions[0]?.id ?? ""];
    } else {
      if (correctAnswer === id) newAnswer = newOptions[0]?.id ?? "";
    }
    onChange({
      ...question,
      config: { ...question.config, options: newOptions },
      correctAnswer: newAnswer,
    });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">
        Answer Options{" "}
        <span className="font-normal text-muted-foreground">
          — {multi ? "check all correct answers" : "select the correct answer"}
        </span>
      </Label>

      {/* Single choice: ONE RadioGroup wraps all rows */}
      {!multi ? (
        <RadioGroup
          value={correctAnswer}
          onValueChange={(v) => onChange({ ...question, correctAnswer: v })}
          className="space-y-2"
        >
          {options.map((opt, idx) => (
            <div
              key={opt.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-all",
                correctAnswer === opt.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
              )}
            >
              <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} className="shrink-0" />
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                {OPTION_LABELS[idx]}
              </div>
              <Input
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                placeholder={`Option ${OPTION_LABELS[idx]}…`}
                className="flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/50"
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(opt.id)}
                  className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </RadioGroup>
      ) : (
        /* Multi choice: individual checkboxes */
        <div className="space-y-2">
          {options.map((opt, idx) => {
            const isChecked = (correctAnswer as string[]).includes(opt.id);
            return (
              <div
                key={opt.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-all",
                  isChecked
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
                )}
              >
                <Checkbox
                  id={`opt-${opt.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const current = correctAnswer as string[];
                    const next = checked
                      ? [...current, opt.id]
                      : current.filter((a) => a !== opt.id);
                    onChange({
                      ...question,
                      correctAnswer: next.length > 0 ? next : [options[0]?.id ?? ""],
                    });
                  }}
                  className="shrink-0"
                />
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                  {OPTION_LABELS[idx]}
                </div>
                <Input
                  value={opt.text}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  placeholder={`Option ${OPTION_LABELS[idx]}…`}
                  className="flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/50"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(opt.id)}
                    className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {options.length < 10 && (
        <Button variant="outline" size="sm" className="gap-2" onClick={addOption}>
          <Plus className="h-3.5 w-3.5" />
          Add Option
        </Button>
      )}
    </div>
  );
}

function TrueFalseEditor({
  question,
  onChange,
}: {
  question: LocalQuestion;
  onChange: (q: LocalQuestion) => void;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">Correct Answer</Label>
      <div className="flex gap-3">
        {([true, false] as const).map((val) => (
          <button
            key={String(val)}
            onClick={() => onChange({ ...question, correctAnswer: val })}
            className={cn(
              "flex flex-1 items-center justify-center rounded-xl border-2 py-8 text-base font-semibold transition-all",
              question.correctAnswer === val
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted"
            )}
          >
            {val ? "✓  True" : "✗  False"}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextAnswerEditor({
  question,
  onChange,
}: {
  question: LocalQuestion;
  onChange: (q: LocalQuestion) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Correct Answer</Label>
        <Input
          value={question.correctAnswer}
          onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
          placeholder="Type the correct answer…"
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="case-sensitive"
          checked={question.config.caseSensitive ?? false}
          onCheckedChange={(checked) =>
            onChange({
              ...question,
              config: { ...question.config, caseSensitive: !!checked },
            })
          }
        />
        <Label htmlFor="case-sensitive" className="cursor-pointer text-sm text-muted-foreground">
          Case-sensitive matching
        </Label>
      </div>
    </div>
  );
}

function SequenceEditor({
  question,
  onChange,
}: {
  question: LocalQuestion;
  onChange: (q: LocalQuestion) => void;
}) {
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
    const newId = String(items.length + 1);
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

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">
        Sequence Items{" "}
        <span className="font-normal text-muted-foreground">(correct order: top → bottom)</span>
      </Label>
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
        >
          <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
            {idx + 1}
          </div>
          <Input
            value={item.text}
            onChange={(e) => updateItem(item.id, e.target.value)}
            placeholder={`Item ${idx + 1}…`}
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
      ))}
      {items.length < 20 && (
        <Button variant="outline" size="sm" className="gap-2" onClick={addItem}>
          <Plus className="h-3.5 w-3.5" />
          Add Item
        </Button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewQuizPage() {
  const router = useRouter();
  const { mutate: createQuiz, isPending } = useCreateQuiz();

  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [questions, setQuestions] = useState<LocalQuestion[]>([defaultQuestion("single_choice")]);
  const [activeIdx, setActiveIdx] = useState(0);

  const activeQuestion = questions[activeIdx] ?? null;

  const addQuestion = (type: LocalQuestion["type"]) => {
    const newQuestions = [...questions, defaultQuestion(type)];
    setQuestions(newQuestions);
    setActiveIdx(newQuestions.length - 1);
  };

  const deleteQuestion = (idx: number) => {
    if (questions.length === 1) return;
    const newQuestions = questions.filter((_, i) => i !== idx);
    setQuestions(newQuestions);
    setActiveIdx(Math.min(activeIdx, newQuestions.length - 1));
  };

  const updateActiveQuestion = (updated: LocalQuestion) => {
    setQuestions((prev) => prev.map((q, i) => (i === activeIdx ? updated : q)));
  };

  const changeQuestionType = (type: LocalQuestion["type"]) => {
    const fresh = defaultQuestion(type);
    updateActiveQuestion({ ...fresh, text: activeQuestion?.text ?? "" });
  };

  const handleSave = () => {
    if (!quizTitle.trim()) {
      toast.error("Please enter a quiz title.");
      return;
    }
    const formatted = questions.map((q, idx) => ({
      type: q.type,
      text: q.text || `Question ${idx + 1}`,
      durationSeconds: Number(q.durationSeconds),
      marks: Number(q.marks),
      config: q.config,
      correctAnswer: q.correctAnswer,
      orderIndex: idx,
    }));

    createQuiz(
      { title: quizTitle, description: quizDescription, questions: formatted },
      {
        onSuccess: () => {
          toast.success("Quiz created successfully!");
          router.push("/dashboard");
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to create quiz. Please check all fields.");
        },
      }
    );
  };

  function TypeIcon({ type }: { type: LocalQuestion["type"] }) {
    const found = QUESTION_TYPES.find((qt) => qt.value === type);
    const Icon = found?.icon ?? ChevronRight;
    return <Icon className="h-3.5 w-3.5 shrink-0" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── LEFT SIDEBAR: Question List ── */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="flex-1 font-semibold text-sm text-foreground">Questions</span>
          <Badge variant="secondary" className="text-xs">{questions.length}</Badge>
        </div>

        {/* Question list */}
        <div className="flex-1 overflow-y-auto py-1">
          {questions.map((q, idx) => (
            <div
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={cn(
                "group flex cursor-pointer items-center gap-2 px-3 py-2.5 transition-colors",
                activeIdx === idx ? "bg-primary/10" : "hover:bg-muted"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold",
                  activeIdx === idx
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {idx + 1}
              </div>
              <TypeIcon type={q.type} />
              <span
                className={cn(
                  "flex-1 truncate text-xs",
                  activeIdx === idx ? "font-medium text-primary" : "text-foreground"
                )}
              >
                {q.text.trim() || <span className="italic text-muted-foreground">Untitled</span>}
              </span>
              {questions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteQuestion(idx);
                  }}
                  className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive group-hover:flex"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Add question type buttons */}
        <div className="p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Add Question</p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUESTION_TYPES.map((qt) => {
              const Icon = qt.icon;
              return (
                <Button
                  key={qt.value}
                  variant="outline"
                  size="sm"
                  className="h-8 justify-start gap-1.5 px-2 text-xs"
                  onClick={() => addQuestion(qt.value)}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{qt.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar: Quiz title + save */}
        <div className="border-b border-border bg-card px-6 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <input
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Untitled Quiz"
                className="w-full bg-transparent text-xl font-bold text-foreground placeholder:text-muted-foreground/40 outline-none focus:outline-none"
              />
              <input
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                placeholder="Add a short description…"
                className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/40 outline-none focus:outline-none"
              />
            </div>
            <Button onClick={handleSave} disabled={isPending} className="shrink-0 mt-1">
              {isPending ? "Saving…" : "Save Quiz"}
            </Button>
          </div>
        </div>

        {/* Editor area — two columns: main content left, config panel right */}
        {activeQuestion ? (
          <div className="flex flex-1 overflow-hidden">

            {/* LEFT: Question text + answers — takes up most of the space */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">

              {/* Question prompt */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-foreground">Question</Label>
                <Textarea
                  value={activeQuestion.text}
                  onChange={(e) =>
                    updateActiveQuestion({ ...activeQuestion, text: e.target.value })
                  }
                  placeholder="Type your question here…"
                  className="min-h-[120px] resize-none text-base leading-relaxed"
                  autoFocus
                />
              </div>

              {/* Answer config */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-foreground">Answer Configuration</Label>
                {activeQuestion.type === "single_choice" && (
                  <ChoiceEditor question={activeQuestion} multi={false} onChange={updateActiveQuestion} />
                )}
                {activeQuestion.type === "multi_choice" && (
                  <ChoiceEditor question={activeQuestion} multi={true} onChange={updateActiveQuestion} />
                )}
                {activeQuestion.type === "true_false" && (
                  <TrueFalseEditor question={activeQuestion} onChange={updateActiveQuestion} />
                )}
                {activeQuestion.type === "text" && (
                  <TextAnswerEditor question={activeQuestion} onChange={updateActiveQuestion} />
                )}
                {activeQuestion.type === "sequence" && (
                  <SequenceEditor question={activeQuestion} onChange={updateActiveQuestion} />
                )}
              </div>
            </div>

            {/* RIGHT: Config panel — fixed width, sticky */}
            <div className="w-64 shrink-0 border-l border-border bg-card overflow-y-auto p-5 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Question Settings
                </p>
                <div className="space-y-4">

                  {/* Type */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Question Type</Label>
                    <Select
                      value={activeQuestion.type}
                      onValueChange={(v) => changeQuestionType(v as LocalQuestion["type"])}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map((qt) => (
                          <SelectItem key={qt.value} value={qt.value}>
                            {qt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Time Limit
                    </Label>
                    <Select
                      value={String(activeQuestion.durationSeconds)}
                      onValueChange={(v) =>
                        updateActiveQuestion({ ...activeQuestion, durationSeconds: Number(v) })
                      }
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {d >= 60 ? `${d / 60} minute${d > 60 ? "s" : ""}` : `${d} seconds`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Marks */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" /> Points / Marks
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={activeQuestion.marks}
                      onChange={(e) =>
                        updateActiveQuestion({ ...activeQuestion, marks: Number(e.target.value) })
                      }
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Question summary */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Quiz Summary
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Questions</span>
                    <span className="font-medium text-foreground">{questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Marks</span>
                    <span className="font-medium text-foreground">
                      {questions.reduce((sum, q) => sum + Number(q.marks), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a question from the sidebar to start editing.
          </div>
        )}
      </div>
    </div>
  );
}



