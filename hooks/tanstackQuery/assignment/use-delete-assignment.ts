import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classroomId, assignmentId }: { classroomId: number; assignmentId: number }) => {
      const res = await fetch(`/api/classroom/${classroomId}/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete assignment");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assignments", variables.classroomId] });
    },
  });
}
