import { AdminShell } from '@/components/layout/admin-shell';

export default function AdminUsersPage() {
  return (
    <AdminShell title="用户管理" description="维护用户权限与状态">
      <div className="rounded-3xl border border-dashed border-white/10 p-6 text-sm text-neutral-400">
        用户管理功能建设中，敬请期待。
      </div>
    </AdminShell>
  );
}
