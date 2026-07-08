import { useQuery } from "@tanstack/react-query";

export function useGetClassrooms() {
  return useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const res = await fetch(`/api/classroom`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch classrooms");
      }
      return res.json();
    },
  });
}
