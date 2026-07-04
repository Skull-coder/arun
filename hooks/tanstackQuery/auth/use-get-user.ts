import { useQuery } from "@tanstack/react-query";

export function useGetUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const res = await fetch("/api/user/me");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch user info");
      }
      const data = await res.json();
      return data.user;
    },
  });
}
