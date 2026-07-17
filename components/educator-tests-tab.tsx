'use client'

import { useState, useEffect } from 'react'
import { useInView } from "react-intersection-observer"

import { useGetTests } from '@/hooks/tanstackQuery/test/use-get-tests'
import { useDeleteTest } from '@/hooks/tanstackQuery/test/use-delete-test'
import { useUpdateTest } from '@/hooks/tanstackQuery/test/use-update-test'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardCard } from '@/components/ui/dashboard-card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  Square,
  Eye,
  ClipboardList,
  Clock,
  Trophy,
  Target,
  Hash,
  CalendarDays,
  ListFilter,
  CheckCircle2,
  Timer,
  Copy,
  Ban,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface EducatorTestsTabProps {
  classroomId: number
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'scheduled') {
    return <Badge variant="secondary">Upcoming</Badge>
  }

  if (status === 'ongoing') {
    return (
      <span className="relative flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-sm font-medium">Live</span>
      </span>
    )
  }

  if (status === 'completed') {
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        Completed
      </Badge>
    )
  }

  return <Badge variant="outline">{status}</Badge>
}

export function EducatorTestsTab({ classroomId }: EducatorTestsTabProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState("all")

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetTests(classroomId)
  const tests = data?.pages?.flatMap(p => p.tests) || []

  const { ref: observerRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  const filteredTests = tests?.filter((test: any) => {
    if (statusFilter === "all") return true;
    return test.status === statusFilter;
  });

  const { mutate: deleteTest } = useDeleteTest()
  const { mutate: updateTest } = useUpdateTest()

  const handleDelete = (testId: number) => {
    deleteTest(
      { id: testId, classroomId },
      {
        onSuccess: () => {
          toast.success('Test deleted successfully.')
        },
        onError: (error: Error) => {
          toast.error(error.message)
        },
      },
    )
  }

  const handleStart = (testId: number) => {
    updateTest(
      { id: testId, status: 'ongoing' },
      {
        onSuccess: () => {
          toast.success('Test started!')
        },
        onError: (error: Error) => {
          toast.error(error.message)
        },
      },
    )
  }

  const handleEnd = (testId: number) => {
    updateTest(
      { id: testId, status: 'completed' },
      {
        onSuccess: () => {
          toast.success('Test ended!')
        },
        onError: (error: Error) => {
          toast.error(error.message)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Tests</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule and manage competitive tests for your classroom
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "All Tests" },
              { key: "draft", label: "Drafts" },
              { key: "scheduled", label: "Upcoming" },
              { key: "ongoing", label: "Live" },
              { key: "completed", label: "Completed" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  statusFilter === f.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Button asChild size="sm" className="h-9 shrink-0 w-full sm:w-auto">
            <Link href={`/dashboard/classroom/${classroomId}/test/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Link>
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col h-full bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
              <div className="p-6 pb-4 flex justify-between items-start gap-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="px-6 pb-4 flex-1">
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
              <div className="px-6 pt-4 pb-4 border-t mt-auto flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!tests || tests.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">No tests yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first competitive test for this classroom.
            </p>
          </div>
          <Button asChild>
            <Link href={`/dashboard/classroom/${classroomId}/test/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Link>
          </Button>
        </div>
      )}

      {/* Tests grid */}
      {!isLoading && tests && tests.length > 0 && (
        <>
          {filteredTests?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No tests match your filter.</p>
              <Button variant="link" onClick={() => setStatusFilter("all")}>
                Clear Filter
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTests?.map((test: any) => {
                const displayStatus = test.status;
                const isScheduled = displayStatus === "scheduled";
                const isDraft = displayStatus === "draft";
                const isOngoing = displayStatus === "ongoing";
                const isCompleted = displayStatus === "completed";

                return (
                  <DashboardCard
                    key={test.id}
                    title={test.title}
                    statusNode={<StatusBadge status={displayStatus} />}
                    stats={[
                      {
                        icon: Hash,
                        value: test.totalQuestions ?? '—',
                        label: 'Questions'
                      },
                      {
                        icon: Target,
                        value: test.totalMarks ?? '—',
                        label: 'Marks'
                      },
                      {
                        icon: Clock,
                        value: test.durationMinutes,
                        label: 'Mins'
                      }
                    ]}
                    footerLeft={
                      <>
                        <CalendarDays className="h-3.5 w-3.5" />
                        {test.scheduledAt ? format(new Date(test.scheduledAt), 'MMM d, h:mm a') : 'Anytime'}
                      </>
                    }
                    footerRight={
                      <>
                        <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                          <Link href={`/dashboard/classroom/${classroomId}/test/${test.id}`}>
                            Manage
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(isScheduled || isDraft) && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/classroom/${classroomId}/test/${test.id}/edit`} className="flex items-center gap-2">
                                  <Pencil className="h-4 w-4" /> Edit
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/classroom/${classroomId}/test/${test.id}?preview=true`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" /> Preview
                              </Link>
                            </DropdownMenuItem>
                            {isCompleted && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/classroom/${classroomId}/test/${test.id}/results`} className="flex items-center gap-2">
                                  <Trophy className="h-4 w-4" /> View Results
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {(isScheduled || isOngoing || isCompleted) && <DropdownMenuSeparator />}
                            {isScheduled && (
                              <DropdownMenuItem onClick={() => handleStart(test.id)} className="flex items-center gap-2 text-primary focus:text-primary">
                                <Play className="h-4 w-4" /> Start Early
                              </DropdownMenuItem>
                            )}
                            {isOngoing && (
                              <DropdownMenuItem onClick={() => handleEnd(test.id)} className="flex items-center gap-2 text-red-600 focus:bg-red-500/10 focus:text-red-600">
                                <Ban className="h-4 w-4" /> End Test Now
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(test.id)} className="flex items-center gap-2 text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    }
                  />
                );
              })}
            </div>
          )}

          {hasNextPage && (
            <div ref={observerRef} className="py-8 flex justify-center">
              <span className="text-sm text-muted-foreground animate-pulse">Loading more tests...</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
