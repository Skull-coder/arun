import { useQuery } from "@tanstack/react-query";

export function useGetClassroomMembers(classroomId: string | number, status?: "pending" | "approved") {
  return useQuery({
    queryKey: ["classroomMembers", String(classroomId), status],
    queryFn: async () => {
      const url = new URL(`/api/classroom/${classroomId}/members`, window.location.origin);
      if (status) {
        url.searchParams.append("status", status);
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch classroom members");
      }
      return res.json();
    },
    enabled: !!classroomId,
  });
}
