import { useQuery } from "@tanstack/react-query";

export function useGetClassroom(id: string | number) {
  return useQuery({
    queryKey: ["classroom", String(id)],
    queryFn: async () => {
      const res = await fetch(`/api/classroom/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch classroom");
      }
      return res.json();
    },
    enabled: !!id,
  });
}
