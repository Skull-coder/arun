import { CreateTestClient } from "@/components/create-test-client";

export default async function NewTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classroomId = parseInt(id, 10);

  return <CreateTestClient classroomId={classroomId} />;
}
