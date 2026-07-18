"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Completing sign in…
      </p>
      {/* Required by Clerk for bot protection in custom OAuth flows */}
      <div id="clerk-captcha" />
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/onboarding"
        signUpForceRedirectUrl="/onboarding"
      />
    </div>
  );
}
