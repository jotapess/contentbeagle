import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { LoginForm } from "./login-form";

function LoginFormFallback() {
  return (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
