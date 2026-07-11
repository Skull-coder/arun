import { TestDetailClient } from "@/components/test-detail-client";

export default async function TestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; testId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { id, testId } = await params;
  const { preview } = await searchParams;

  const classroomId = parseInt(id, 10);
  const testIdNum = parseInt(testId, 10);
  const isPreview = preview === "true";

  return (
    <TestDetailClient
      classroomId={classroomId}
      testId={testIdNum}
      isPreview={isPreview}
    />
  );
}
