import { useQuery } from "@tanstack/react-query";

export function useGetEducatorAnalytics(classroomId: number) {
  return useQuery({
    queryKey: ["analytics", "educator", classroomId],
    queryFn: async () => {
      const res = await fetch(`/api/classroom/${classroomId}/analytics/educator`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch educator analytics");
      }
      return res.json();
    },
  });
}
