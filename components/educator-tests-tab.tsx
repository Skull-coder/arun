'use client'

import { useState } from 'react'

import { useGetTests } from '@/hooks/tanstackQuery/test/use-get-tests'
import { useDeleteTest } from '@/hooks/tanstackQuery/test/use-delete-test'
import { useUpdateTest } from '@/hooks/tanstackQuery/test/use-update-test'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  FileText,
  Ban,
  Trophy,
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

  const { data, isLoading } = useGetTests(classroomId)
  const tests = data?.tests

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Tests</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule and manage competitive tests for your classroom
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
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
          <Button asChild size="sm" className="h-9">
            <Link href={`/dashboard/classroom/${classroomId}/test/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Link>
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Scheduled At</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      {/* Tests table */}
      {!isLoading && tests && tests.length > 0 && (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Scheduled At</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No tests match your filter.
                  </TableCell>
                </TableRow>
              )}
              {filteredTests?.map((test: any) => {
                const displayStatus = test.status;
                const isScheduled = displayStatus === "scheduled";
                const isDraft = displayStatus === "draft";
                const isOngoing = displayStatus === "ongoing";
                const isCompleted = displayStatus === "completed";
                const isNotOngoing = !isOngoing;

                return (
                  <TableRow 
                    key={test.id} 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => router.push(`/dashboard/classroom/${classroomId}/test/${test.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {test.title}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={displayStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {test.totalQuestions ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {test.totalMarks ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {test.durationMinutes} min
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {test.scheduledAt
                        ? format(new Date(test.scheduledAt), 'MMM d, yyyy HH:mm')
                        : '—'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(isScheduled || isDraft) && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/classroom/${classroomId}/test/${test.id}/edit`}
                                className="flex items-center gap-2"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/classroom/${classroomId}/test/${test.id}?preview=true`}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Preview
                            </Link>
                          </DropdownMenuItem>

                          {isCompleted && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/classroom/${classroomId}/test/${test.id}/results`}
                                className="flex items-center gap-2"
                              >
                                <Trophy className="h-4 w-4" />
                                View Results
                              </Link>
                            </DropdownMenuItem>
                          )}

                          {(isScheduled || isOngoing || isCompleted) && (
                            <DropdownMenuSeparator />
                          )}

                          {isScheduled && (
                            <DropdownMenuItem
                              onClick={() => handleStart(test.id)}
                              className="flex items-center gap-2 text-primary focus:text-primary"
                            >
                              <Play className="h-4 w-4" />
                              Start Early
                            </DropdownMenuItem>
                          )}

                          {isOngoing && (
                            <DropdownMenuItem
                              onClick={() => handleEnd(test.id)}
                              className="flex items-center gap-2 text-red-600 focus:bg-red-500/10 focus:text-red-600"
                            >
                              <Ban className="h-4 w-4" />
                              End Test Now
                            </DropdownMenuItem>
                          )}

                          {true && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(test.id)}
                                className="flex items-center gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
