import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HostQuizControlInput } from "@/features/quiz/validations/hostQuizControl";

export function useHostControl(quizId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HostQuizControlInput) => {
      const res = await fetch(`/api/quiz/${quizId}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to perform host action");
      }
      return res.json();
    },
    onSuccess: () => {
      // Refresh the quiz state so the host dashboard immediately updates
      queryClient.invalidateQueries({ queryKey: ["quiz", quizId.toString()] });
    },
  });
}
