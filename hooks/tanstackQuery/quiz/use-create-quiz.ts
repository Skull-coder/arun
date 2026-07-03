import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateQuizInput } from "@/features/quiz/validations/createQuiz";

export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuizInput) => {
      const res = await fetch(`/api/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create quiz");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate the quizzes list query so the dashboard shows the newly created quiz
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}
