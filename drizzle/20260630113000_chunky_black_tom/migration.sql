CREATE TABLE "questions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "questions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"quizId" integer NOT NULL,
	"text" text NOT NULL,
	"durationSeconds" integer DEFAULT 30 NOT NULL,
	"type" varchar(30) NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"correctAnswer" jsonb NOT NULL,
	"marks" integer DEFAULT 0 NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "quiz_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"quizId" integer NOT NULL,
	"studentId" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"submittedAt" timestamp,
	"totalScore" integer
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "quizzes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"description" text,
	"totalMarks" integer,
	"creatorId" varchar(255) NOT NULL,
	"joinCode" varchar(10) NOT NULL UNIQUE,
	"isPublished" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_answers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "student_answers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sessionId" integer NOT NULL,
	"questionId" integer NOT NULL,
	"answer" jsonb NOT NULL,
	"isCorrect" boolean,
	"score" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY UNIQUE,
	"email" varchar(255) NOT NULL UNIQUE,
	"firstName" varchar(255),
	"lastName" varchar(255),
	"role" varchar(20) DEFAULT 'student' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_quizId_quizzes_id_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_quizId_quizzes_id_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_studentId_users_id_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_creatorId_users_id_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_sessionId_quiz_sessions_id_fkey" FOREIGN KEY ("sessionId") REFERENCES "quiz_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_questionId_questions_id_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE;