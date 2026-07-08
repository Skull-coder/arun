import { useMutation, useQueryClient } from "@tanstack/react-query";
import { JoinClassroomInput } from "@/features/classroom/validations/joinClassroom";

export function useJoinClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: JoinClassroomInput) => {
      const res = await fetch(`/api/classroom/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to join classroom");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });
}
