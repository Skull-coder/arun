import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUnsubmitAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classroomId, assignmentId }: { classroomId: number; assignmentId: number }) => {
      const res = await fetch(
        `/api/classroom/${classroomId}/assignments/${assignmentId}/submissions`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to unsubmit");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["submissions", variables.classroomId, variables.assignmentId],
      });
    },
  });
}
