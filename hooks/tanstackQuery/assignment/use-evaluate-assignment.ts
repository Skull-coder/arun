import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetFeedback(classroomId: number, assignmentId: number, submissionId: number | null) {
  return useQuery({
    queryKey: ["feedback", submissionId],
    queryFn: async () => {
      const res = await fetch(
        `/api/classroom/${classroomId}/assignments/${assignmentId}/submissions/${submissionId}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch feedback");
      }
      return res.json();
    },
    enabled: !!submissionId,
  });
}

export function useEvaluateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      classroomId: number;
      assignmentId: number;
      submissionId: number;
      status: "accepted" | "returned";
      feedback?: string;
    }) => {
      const res = await fetch(
        `/api/classroom/${data.classroomId}/assignments/${data.assignmentId}/submissions/${data.submissionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: data.status, feedback: data.feedback }),
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to evaluate submission");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["submissions", variables.classroomId, variables.assignmentId],
      });
      queryClient.invalidateQueries({ queryKey: ["feedback", variables.submissionId] });
    },
  });
}
