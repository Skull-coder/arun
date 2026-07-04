import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateRoleInput } from "@/features/auth/validations/updateRole";

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateRoleInput) => {
      const res = await fetch(`/api/user/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update role");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate any user-related queries if you have them
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
