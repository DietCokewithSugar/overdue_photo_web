import { ContestCreateForm } from '@/features/admin/contests/contest-create-form';
import { AdminContestList } from '@/features/admin/contests/contest-list';

export default function AdminContestsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-neutral-100">比赛管理</h2>
      <ContestCreateForm />
      <AdminContestList />
    </div>
  );
}
