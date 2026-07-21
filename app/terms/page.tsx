import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Skullcoder",
  description: "Terms of Service for Skullcoder platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p>
            Welcome to Skullcoder! These Terms of Service outline the rules and regulations for the use of our educational platform.
            By accessing this website, we assume you accept these terms of service in full. Do not continue to use Skullcoder if you do not accept all of the terms and conditions stated on this page.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Accounts and Registration</h2>
          <p>
            To use certain features of the platform (such as creating classrooms or taking tests), you must register for an account using your Google account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. User Roles</h2>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Educators:</strong> Educators have the ability to create classrooms, invite students, and administer quizzes and assignments. Educators are responsible for the content they publish and ensure it does not violate any laws.</li>
            <li><strong>Students:</strong> Students can join classrooms using valid codes, take tests, and submit assignments. Students agree to follow the rules set by their educators and maintain academic integrity.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Acceptable Use</h2>
          <p>
            You agree not to use the platform to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Upload or distribute any content that is unlawful, defamatory, or infringes on any intellectual property rights.</li>
            <li>Attempt to cheat, hack, or exploit vulnerabilities in the testing or quiz systems.</li>
            <li>Harass, abuse, or harm another person.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Intellectual Property Rights</h2>
          <p>
            Unless otherwise stated, Skullcoder and/or its licensors own the intellectual property rights for all material on the platform. All intellectual property rights are reserved. You may view and/or print pages from the website for your own personal use subject to restrictions set in these terms of service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Disclaimer of Warranties</h2>
          <p>
            The materials on Skullcoder's website are provided on an 'as is' basis. Skullcoder makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Changes to Terms</h2>
          <p>
            We reserve the right to revise these terms of service for our website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
