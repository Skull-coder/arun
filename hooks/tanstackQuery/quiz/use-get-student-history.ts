import { useQuery } from "@tanstack/react-query";

export function useGetStudentHistory() {
  return useQuery({
    queryKey: ["student-history"],
    queryFn: async () => {
      const res = await fetch("/api/student/history");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch quiz history");
      }
      const data = await res.json();
      return data.sessions as {
        sessionId: number;
        quizId: number;
        totalScore: number;
        totalTimeTakenMs: number;
        startedAt: string;
        submittedAt: string | null;
        quizTitle: string;
        quizDescription: string | null;
        quizStatus: string;
        quizTotalMarks: number | null;
        quizTotalQuestions: number | null;
      }[];
    },
  });
}
