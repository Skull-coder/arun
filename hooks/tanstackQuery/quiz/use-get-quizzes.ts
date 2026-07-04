import { useQuery } from "@tanstack/react-query";

interface GetQuizzesParams {
  limit?: number;
  offset?: number;
}

export function useGetQuizzes(params?: GetQuizzesParams) {
  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;

  return useQuery({
    queryKey: ["quizzes", { limit, offset }],
    queryFn: async () => {
      const res = await fetch(`/api/quiz?limit=${limit}&offset=${offset}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch quizzes");
      }
      const data = await res.json();
      return data.quizzes;
    },
  });
}
