import { useQuery } from "@tanstack/react-query";

export function useGetStudentAnalytics(classroomId: number) {
  return useQuery({
    queryKey: ["analytics", "student", classroomId],
    queryFn: async () => {
      const res = await fetch(`/api/classroom/${classroomId}/analytics/student`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch student analytics");
      }
      return res.json();
    },
  });
}
