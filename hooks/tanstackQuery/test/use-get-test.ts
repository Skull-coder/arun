import { useQuery } from "@tanstack/react-query";

export const useGetTest = (testId: number | null, refetchInterval?: number | false) => {
  return useQuery({
    queryKey: ["test", testId],
    queryFn: async () => {
      if (!testId) return null;
      
      const response = await fetch(`/api/test/${testId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch test");
      }

      return result; // returns { test: ..., questions: ... }
    },
    enabled: !!testId,
    refetchInterval,
  });
};
