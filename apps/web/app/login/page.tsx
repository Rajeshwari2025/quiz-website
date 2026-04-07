import { AuthForm } from "../../components/forms/auth-form";
import { SiteShell } from "../../components/layout/site-shell";

export default function LoginPage() {
  return (
    <SiteShell
      title="Login"
      eyebrow="Secure access"
      description="Sign in with your registered credentials to access the faculty or student dashboard."
    >
      <AuthForm mode="login" />
    </SiteShell>
  );
}
