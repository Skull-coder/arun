import { useMutation } from "@tanstack/react-query";
import { JoinQuizInput } from "@/features/quiz/validations/joinQuiz";

export function useJoinQuiz() {
  return useMutation({
    mutationFn: async (data: JoinQuizInput) => {
      const res = await fetch(`/api/quiz/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to join quiz");
      }
      return res.json();
    },
  });
}
