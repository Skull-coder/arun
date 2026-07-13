import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DeleteUpdateData {
  classroomId: number;
  updateId: number;
}

export function useDeleteUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteUpdateData) => {
      const res = await fetch(`/api/classroom/${data.classroomId}/updates/${data.updateId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete update");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["updates", variables.classroomId] });
    },
  });
}
