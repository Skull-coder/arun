import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DeleteTestInput {
  id: number;
  classroomId: number; // passed so we can easily invalidate the list query
}

export const useDeleteTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteTestInput) => {
      const response = await fetch(`/api/test/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete test");
      }

      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate the tests list for the specific classroom
      queryClient.invalidateQueries({ queryKey: ["tests", variables.classroomId] });
    },
  });
};
