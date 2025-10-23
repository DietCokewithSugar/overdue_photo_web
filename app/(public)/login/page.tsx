import { AuthScreen } from '@/features/auth/components/auth-screen';
import { MobileShell } from '@/components/layout/mobile-shell';

export default function LoginPage() {
  return (
    <MobileShell title="账号中心" showTopBar>
      <div className="flex flex-col gap-6 pb-24">
        <AuthScreen />
      </div>
    </MobileShell>
  );
}
