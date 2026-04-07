import { AuthForm } from "../../components/forms/auth-form";
import { SiteShell } from "../../components/layout/site-shell";

export default function RegisterPage() {
  return (
    <SiteShell
      title="Register"
      eyebrow="Invite-aware onboarding"
      description="Create a student account directly or register as faculty with a valid invite token."
    >
      <AuthForm mode="register" />
    </SiteShell>
  );
}
