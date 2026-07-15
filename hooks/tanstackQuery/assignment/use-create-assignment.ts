import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateAssignmentData {
  classroomId: number;
  title: string;
  description: string;
  dueDate: string | null;
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAssignmentData) => {
      const res = await fetch(`/api/classroom/${data.classroomId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create assignment");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assignments", variables.classroomId] });
    },
  });
}
