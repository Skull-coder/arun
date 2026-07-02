import { useQuery } from "@tanstack/react-query";

export function useGetQuiz(quizId: string | number) {
  return useQuery({
    queryKey: ["quiz", quizId.toString()],
    queryFn: async () => {
      if (!quizId) throw new Error("Quiz ID is required");
      const res = await fetch(`/api/quiz/${quizId}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch quiz");
      }
      
      return res.json();
    },
    enabled: !!quizId,
  });
}
