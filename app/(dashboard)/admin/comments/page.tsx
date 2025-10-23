import { AdminCommentsTable } from '@/features/admin/comments/comments-table';

export default function AdminCommentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-neutral-100">评论管理</h2>
      <AdminCommentsTable />
    </div>
  );
}
