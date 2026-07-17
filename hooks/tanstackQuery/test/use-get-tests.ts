import { useInfiniteQuery } from "@tanstack/react-query";

export const useGetTests = (classroomId: number | null) => {
  return useInfiniteQuery({
    queryKey: ["tests", classroomId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!classroomId) return { tests: [] };
      
      const response = await fetch(`/api/classroom/${classroomId}/tests?page=${pageParam}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch tests");
      }

      return result; // returns { tests: ... }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 1,
    enabled: !!classroomId,
  });
};
