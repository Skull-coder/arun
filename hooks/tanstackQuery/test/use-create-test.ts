import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateTestInput } from "@/features/test/validations/createTest";

export const useCreateTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTestInput) => {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create test");
      }

      return result.test;
    },
    onSuccess: (data) => {
      // Invalidate the tests list for the specific classroom
      queryClient.invalidateQueries({ queryKey: ["tests", data.classroomId] });
    },
  });
};
