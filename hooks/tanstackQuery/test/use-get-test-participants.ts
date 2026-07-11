import { useQuery } from "@tanstack/react-query";

export const useGetTestParticipants = (testId: number | null) => {
  return useQuery({
    queryKey: ["test", testId, "participants"],
    queryFn: async () => {
      if (!testId) return null;
      
      const response = await fetch(`/api/test/${testId}/participants`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch participants");
      }

      return result; // returns { participants: [...] }
    },
    enabled: !!testId,
  });
};
