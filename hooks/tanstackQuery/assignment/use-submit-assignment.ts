import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SubmitAssignmentData {
  classroomId: number;
  assignmentId: number;
  file: File;
  onProgress?: (progress: number) => void;
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SubmitAssignmentData) => {
      // Step 1: Get presigned upload URL from our backend
      const urlRes = await fetch(
        `/api/classroom/${data.classroomId}/assignments/${data.assignmentId}/submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get-upload-url",
            filename: data.file.name,
            contentType: data.file.type,
          }),
        }
      );
      if (!urlRes.ok) {
        const error = await urlRes.json();
        throw new Error(error.error || "Failed to get upload URL");
      }
      const { signedUrl, fileKey } = await urlRes.json();

      // Step 2: Upload directly to Cloudflare R2 using XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl, true);
        xhr.setRequestHeader("Content-Type", data.file.type);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && data.onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            data.onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("File upload to storage failed. Check CORS settings."));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during file upload."));
        
        xhr.send(data.file);
      });

      // Step 3: Record the submission in our database
      const submitRes = await fetch(
        `/api/classroom/${data.classroomId}/assignments/${data.assignmentId}/submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submit",
            fileUrl: fileKey,
            fileName: data.file.name,
          }),
        }
      );
      if (!submitRes.ok) {
        const error = await submitRes.json();
        throw new Error(error.error || "Failed to record submission");
      }
      return submitRes.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["submissions", variables.classroomId, variables.assignmentId],
      });
    },
  });
}
