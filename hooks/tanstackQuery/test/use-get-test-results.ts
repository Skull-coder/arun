import { useQuery } from "@tanstack/react-query";

export const useGetTestResults = (testId: number | null, studentId?: string) => {
  return useQuery({
    queryKey: ["test-results", testId, studentId],
    queryFn: async () => {
      const url = studentId 
        ? `/api/test/${testId}/results?studentId=${studentId}`
        : `/api/test/${testId}/results`;
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to fetch results");
      return result;
    },
    enabled: !!testId,
    retry: false,
  });
};
