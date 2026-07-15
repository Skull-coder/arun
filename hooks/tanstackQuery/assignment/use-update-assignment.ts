import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateAssignmentData {
  classroomId: number;
  assignmentId: number;
  title: string;
  description: string;
  dueDate: string | null;
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateAssignmentData) => {
      const res = await fetch(`/api/classroom/${data.classroomId}/assignments/${data.assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update assignment");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assignments", variables.classroomId] });
    },
  });
}
