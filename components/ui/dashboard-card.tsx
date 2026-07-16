import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import React from "react";

export interface DashboardCardProps {
  title: string;
  description?: string | null;
  statusNode: React.ReactNode;
  stats: {
    icon: React.ElementType;
    value: React.ReactNode;
    label: string;
  }[];
  footerLeft: React.ReactNode;
  footerRight: React.ReactNode;
}

export function DashboardCard({
  title,
  description,
  statusNode,
  stats,
  footerLeft,
  footerRight,
}: DashboardCardProps) {
  return (
    <Card className="flex flex-col h-full bg-card hover:shadow-md transition-shadow border-border/60 group">
      <CardHeader className="pb-4 flex-row justify-between items-start space-y-0 gap-4">
        <div>
          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="shrink-0 mt-0.5">
          {statusNode}
        </div>
      </CardHeader>
      
      <CardContent className="pb-4 flex-1">
        <div 
          className="grid gap-2 bg-muted/40 rounded-lg p-3 border border-border/40"
          style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={`flex flex-col items-center text-center gap-1 ${i > 0 ? "border-l border-border/40" : ""}`}>
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground leading-none mt-0.5">{stat.value}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t bg-muted/10 mt-auto flex justify-between items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
          {footerLeft}
        </div>
        
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {footerRight}
        </div>
      </CardFooter>
    </Card>
  );
}
