import { useQuery } from "@tanstack/react-query";

export function useGetUnreadUpdatesCount(classroomId: number) {
  return useQuery({
    queryKey: ["updates-unread-count", classroomId],
    queryFn: async () => {
      const res = await fetch(`/api/classroom/${classroomId}/updates/unread-count`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch unread count");
      }
      const data = await res.json();
      return data.count as number;
    },
    enabled: !!classroomId,
    // Optionally poll every 60 seconds if you want the badge to update without reloading
    refetchInterval: 60000, 
  });
}
