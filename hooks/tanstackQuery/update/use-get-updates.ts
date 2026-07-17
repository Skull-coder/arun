import { useInfiniteQuery } from "@tanstack/react-query";

export function useGetUpdates(classroomId: number, markAsRead: boolean = false) {
  return useInfiniteQuery({
    queryKey: ["updates", classroomId, markAsRead],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/classroom/${classroomId}/updates?markAsRead=${markAsRead}&page=${pageParam}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch updates");
      }
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 1,
    enabled: !!classroomId,
  });
}
