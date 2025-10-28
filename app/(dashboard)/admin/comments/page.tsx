import { AdminShell } from '@/components/layout/admin-shell';
import { AdminCommentsTable } from '@/features/admin/comments/comments-table';

export default function AdminCommentsPage() {
  return (
    <AdminShell title="评论管理" description="审核并维护社区评论内容">
      <div className="flex flex-col gap-6">
        <AdminCommentsTable />
      </div>
    </AdminShell>
  );
}
