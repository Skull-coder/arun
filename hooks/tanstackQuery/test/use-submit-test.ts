import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SubmitPayload {
  testId: number;
  answers: { questionId: number; answer: any }[];
}

export const useSubmitTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ testId, answers }: SubmitPayload) => {
      const response = await fetch(`/api/test/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to submit test");
      return result;
    },
    onSuccess: (_, { testId }) => {
      queryClient.invalidateQueries({ queryKey: ["test", testId] });
      queryClient.invalidateQueries({ queryKey: ["my-session", testId] });
    },
  });
};
