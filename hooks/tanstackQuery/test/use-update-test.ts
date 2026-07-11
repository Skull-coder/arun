import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateTestInput } from "@/features/test/validations/updateTest";

export const useUpdateTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTestInput) => {
      const response = await fetch(`/api/test/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Omit the id from the body since it's in the URL
        body: JSON.stringify((({ id, ...rest }) => rest)(data)),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update test");
      }

      return { test: result.test, questions: result.questions };
    },
    onSuccess: (data) => {
      // Invalidate the specific test cache
      queryClient.invalidateQueries({ queryKey: ["test", data.test.id] });
      // Also invalidate the tests list for the classroom
      queryClient.invalidateQueries({ queryKey: ["tests", data.test.classroomId] });
    },
  });
};
