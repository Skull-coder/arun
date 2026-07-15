import { useQuery } from "@tanstack/react-query";

export function useGetSubmissions(classroomId: number, assignmentId: number) {
  return useQuery({
    queryKey: ["submissions", classroomId, assignmentId],
    queryFn: async () => {
      const res = await fetch(`/api/classroom/${classroomId}/assignments/${assignmentId}/submissions`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch submissions");
      }
      return res.json();
    },
    enabled: !!classroomId && !!assignmentId,
  });
}
