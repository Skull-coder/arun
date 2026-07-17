import { useInfiniteQuery } from "@tanstack/react-query";

export function useGetAssignments(classroomId: number) {
  return useInfiniteQuery({
    queryKey: ["assignments", classroomId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/classroom/${classroomId}/assignments?page=${pageParam}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch assignments");
      }
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 1,
    enabled: !!classroomId,
  });
}
