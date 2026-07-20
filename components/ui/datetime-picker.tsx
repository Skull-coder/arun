"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DateTimePicker({ value, onChange, placeholder = "Pick a date & time" }: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [hour, setHour] = React.useState<string>(value ? format(value, "hh") : "12");
  const [minute, setMinute] = React.useState<string>(value ? format(value, "mm") : "00");
  const [ampm, setAmpm] = React.useState<string>(value ? format(value, "aa") : "PM");

  React.useEffect(() => {
    if (value) {
      setDate(value);
      setHour(format(value, "hh"));
      setMinute(format(value, "mm"));
      setAmpm(format(value, "aa"));
    } else {
      setDate(undefined);
    }
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    updateValue(selectedDate, hour, minute, ampm);
  };

  const updateValue = (d: Date | undefined, h: string, m: string, a: string) => {
    if (!d) {
      onChange?.(undefined);
      return;
    }
    const newDate = new Date(d.getTime());
    
    let hours24 = parseInt(h, 10);
    if (a === "PM" && hours24 < 12) hours24 += 12;
    if (a === "AM" && hours24 === 12) hours24 = 0;
    
    newDate.setHours(hours24);
    newDate.setMinutes(parseInt(m, 10));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    onChange?.(newDate);
  };

  // Generate 1-12
  const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  // Generate 0-59 (step by 5 usually better but lets do step by 1 or 5. Let's do step 5 for cleaner UI)
  const minutesList = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "MMM d, yyyy 'at' h:mm a") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-border/50 shadow-lg scale-90 sm:scale-100 origin-top-left" align="start">
        {/* Calendar */}
        <div className="w-full flex justify-center bg-card rounded-t-md pt-3 pb-1">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            className="p-0"
          />
        </div>

        {/* Time Picker */}
        <div className="p-3 border-t border-border bg-muted/10">
          <Label className="text-xs flex items-center gap-2 text-muted-foreground font-medium mb-3">
            <Clock className="h-3.5 w-3.5 text-primary" /> Select Time
          </Label>
          <div className="flex items-center justify-center gap-1.5 bg-background p-1.5 rounded-lg border border-border/50 shadow-sm">
            <Select value={hour} onValueChange={(v) => { setHour(v); updateValue(date, v, minute, ampm); }}>
              <SelectTrigger className="w-[60px] h-8 text-xs border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent>
                {hoursList.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground font-bold">:</span>
            <Select value={minute} onValueChange={(v) => { setMinute(v); updateValue(date, hour, v, ampm); }}>
              <SelectTrigger className="w-[60px] h-8 text-xs border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {minutesList.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="w-px h-6 bg-border mx-1" />
            <Select value={ampm} onValueChange={(v) => { setAmpm(v); updateValue(date, hour, minute, v); }}>
              <SelectTrigger className="w-[65px] h-8 text-xs border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {value && (
          <div className="p-2 border-t border-border bg-muted/20 flex justify-end">
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-3" onClick={() => onChange?.(undefined)}>Clear Schedule</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
