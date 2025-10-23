import { AdminPostsTable } from '@/features/admin/posts/posts-table';

export default function AdminPostsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-neutral-100">帖子管理</h2>
      <AdminPostsTable />
    </div>
  );
}
