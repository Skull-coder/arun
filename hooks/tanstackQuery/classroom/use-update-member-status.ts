import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateMemberStatusProps {
  classroomId: number | string;
  studentId: string;
  status: "approved" | "rejected";
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classroomId, studentId, status }: UpdateMemberStatusProps) => {
      const res = await fetch(`/api/classroom/${classroomId}/members/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update member status");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classroomMembers", String(variables.classroomId)] });
      queryClient.invalidateQueries({ queryKey: ["classroom", String(variables.classroomId)] });
    },
  });
}
