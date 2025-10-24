import { AuthScreen } from '@/features/auth/components/auth-screen';
import { MobileShell } from '@/components/layout/mobile-shell';

export default function LoginPage() {
  return (
    <MobileShell showTopBar={false}>
      <div className="flex flex-col gap-6 pb-24 pt-6">
        <AuthScreen showAccountActions={false} />
      </div>
    </MobileShell>
  );
}
