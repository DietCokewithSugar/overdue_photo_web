import { AdminShell } from '@/components/layout/admin-shell';
import { AdminUsersTable } from '@/features/admin/users/users-table';

export default function AdminUsersPage() {
  return (
    <AdminShell title="用户管理" description="维护用户权限、角色与状态">
      <div className="flex flex-col gap-6">
        <AdminUsersTable />
      </div>
    </AdminShell>
  );
}
