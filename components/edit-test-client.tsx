"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUpdateTest } from "@/hooks/tanstackQuery/test/use-update-test";
import { useGetTest } from "@/hooks/tanstackQuery/test/use-get-test";
import { TestBuilder, TestBuilderData } from "./test-builder";

export function EditTestClient({ classroomId, testId }: { classroomId: number; testId: number }) {
  const router = useRouter();
  const { data: initialData, isLoading } = useGetTest(testId);
  const { mutate: updateTest, isPending } = useUpdateTest();

  const handleSave = (data: TestBuilderData) => {
    updateTest({
      id: testId,
      ...data,
    }, {
      onSuccess: () => {
        toast.success("Test updated successfully!");
        router.push(`/dashboard/classroom/${classroomId}/tests`);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading test data...</p>
      </div>
    );
  }

  return (
    <TestBuilder
      classroomId={classroomId}
      initialData={initialData}
      onSave={handleSave}
      isSaving={isPending}
      saveButtonText="Save Changes"
      backUrl={`/dashboard/classroom/${classroomId}/tests`}
    />
  );
}
