import { Suspense } from 'react';

import { MobileShell } from '@/components/layout/mobile-shell';
import { ResetPasswordScreen } from '@/features/auth/components/reset-password-screen';

export default function ResetPasswordPage() {
  return (
    <MobileShell showTopBar={false}>
      <div className="flex flex-col gap-6 pb-24 pt-6">
        <Suspense fallback={<div className="h-40 rounded-[28px] bg-neutral-900/40" />}>
          <ResetPasswordScreen />
        </Suspense>
      </div>
    </MobileShell>
  );
}
