import { useMutation, useQueryClient } from "@tanstack/react-query";

interface EditUpdateData {
  classroomId: number;
  updateId: number;
  content: string;
}

export function useEditUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EditUpdateData) => {
      const res = await fetch(`/api/classroom/${data.classroomId}/updates/${data.updateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: data.content }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to edit update");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["updates", variables.classroomId] });
    },
  });
}
