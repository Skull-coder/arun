import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PushUpdateData {
  classroomId: number;
  content: string;
}

export function usePushUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PushUpdateData) => {
      const res = await fetch(`/api/classroom/${data.classroomId}/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: data.content }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to post update");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["updates", variables.classroomId] });
    },
  });
}
