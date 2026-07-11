import { useQuery } from "@tanstack/react-query";

export const useGetMySession = (testId: number | null) => {
  return useQuery({
    queryKey: ["my-session", testId],
    queryFn: async () => {
      const response = await fetch(`/api/test/${testId}/my-session`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to fetch session");
      return result; // { session: {...} | null }
    },
    enabled: !!testId,
  });
};
