import { useInfiniteQuery } from "@tanstack/react-query";

interface GetQuizzesParams {
  limit?: number;
}

export function useGetQuizzes(params?: GetQuizzesParams) {
  const limit = params?.limit ?? 20;

  return useInfiniteQuery({
    queryKey: ["quizzes", { limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/quiz?limit=${limit}&page=${pageParam}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch quizzes");
      }
      const data = await res.json();
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 1,
  });
}
