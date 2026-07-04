import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateQuizInput } from "@/features/quiz/validations/updateQuiz";

export function useUpdateQuiz(quizId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateQuizInput) => {
      const res = await fetch(`/api/quiz/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update quiz");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["quiz", quizId.toString()] });
    },
  });
}
