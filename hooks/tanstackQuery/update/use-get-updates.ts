import { useQuery } from "@tanstack/react-query";

export function useGetUpdates(classroomId: number, markAsRead: boolean = false) {
  return useQuery({
    queryKey: ["updates", classroomId, markAsRead],
    queryFn: async () => {
      const res = await fetch(`/api/classroom/${classroomId}/updates?markAsRead=${markAsRead}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch updates");
      }
      return res.json();
    },
    enabled: !!classroomId,
  });
}
