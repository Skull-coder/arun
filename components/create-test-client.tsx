"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateTest } from "@/hooks/tanstackQuery/test/use-create-test";
import { TestBuilder, TestBuilderData } from "./test-builder";

export function CreateTestClient({ classroomId }: { classroomId: number }) {
  const router = useRouter();
  const { mutate: createTest, isPending } = useCreateTest();

  const handleSave = (data: TestBuilderData) => {
    createTest({
      classroomId,
      ...data,
    }, {
      onSuccess: () => {
        toast.success("Test created successfully!");
        router.push(`/dashboard/classroom/${classroomId}`);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <TestBuilder
      classroomId={classroomId}
      onSave={handleSave}
      isSaving={isPending}
      saveButtonText="Create Test"
      backUrl={`/dashboard/classroom/${classroomId}`}
    />
  );
}

