import { AdminShell } from '@/components/layout/admin-shell';
import { AdminPostsTable } from '@/features/admin/posts/posts-table';

export default function AdminPostsPage() {
  return (
    <AdminShell title="帖子管理" description="查看、精选与调整帖子状态">
      <div className="flex flex-col gap-6">
        <AdminPostsTable />
      </div>
    </AdminShell>
  );
}
