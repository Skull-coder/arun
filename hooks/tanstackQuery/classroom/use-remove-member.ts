import { useMutation, useQueryClient } from "@tanstack/react-query";

interface RemoveMemberProps {
  classroomId: number | string;
  studentId: string;
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classroomId, studentId }: RemoveMemberProps) => {
      const res = await fetch(`/api/classroom/${classroomId}/members/${studentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to remove member");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classroomMembers", String(variables.classroomId)] });
      queryClient.invalidateQueries({ queryKey: ["classroom", String(variables.classroomId)] });
    },
  });
}
