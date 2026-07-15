import { useQuery } from "@tanstack/react-query";

export function useGetAssignments(classroomId: number) {
  return useQuery({
    queryKey: ["assignments", classroomId],
    queryFn: async () => {
      const res = await fetch(`/api/classroom/${classroomId}/assignments`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch assignments");
      }
      return res.json();
    },
    enabled: !!classroomId,
  });
}
