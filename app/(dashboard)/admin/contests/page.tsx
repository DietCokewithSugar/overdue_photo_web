import { AdminShell } from '@/components/layout/admin-shell';
import { AdminContestList } from '@/features/admin/contests/contest-list';
import { ContestCreateForm } from '@/features/admin/contests/contest-create-form';

export default function AdminContestsPage() {
  return (
    <AdminShell title="比赛管理" description="创建比赛并管理征稿状态">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="flex flex-col gap-6">
          <AdminContestList />
        </div>
        <div className="flex flex-col gap-6">
          <ContestCreateForm />
        </div>
      </div>
    </AdminShell>
  );
}
