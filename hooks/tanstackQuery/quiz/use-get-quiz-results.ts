import { useQuery } from "@tanstack/react-query";

export function useGetQuizResults(id: string) {
  return useQuery({
    queryKey: ["quiz", id, "results"],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/${id}/results`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch quiz results");
      }
      return res.json();
    },
    enabled: !!id,
  });
}
