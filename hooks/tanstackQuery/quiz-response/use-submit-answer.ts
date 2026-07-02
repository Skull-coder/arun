import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SubmitAnswerPayload } from "@/features/quiz-response/validations/submitAnswer";

export function useSubmitAnswer(quizId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitAnswerPayload) => {
      const res = await fetch(`/api/quiz-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit answer");
      }
      return res.json();
    },
    onSuccess: () => {
      // Re-fetch the quiz to ensure we have the latest state/score if needed
      queryClient.invalidateQueries({ queryKey: ["quiz", quizId.toString()] });
    },
  });
}
