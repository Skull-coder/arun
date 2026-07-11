import { useQuery } from "@tanstack/react-query";

export const useGetTests = (classroomId: number | null) => {
  return useQuery({
    queryKey: ["tests", classroomId],
    queryFn: async () => {
      if (!classroomId) return { tests: [] };
      
      const response = await fetch(`/api/classroom/${classroomId}/tests`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch tests");
      }

      return result; // returns { tests: ... }
    },
    enabled: !!classroomId,
  });
};
