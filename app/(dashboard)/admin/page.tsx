import { OverviewCards } from '@/features/admin/dashboard/overview-cards';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <OverviewCards />

      <section className="grid gap-4 rounded-3xl border border-white/5 bg-neutral-900/50 p-6">
        <h2 className="text-lg font-semibold text-neutral-100">待办提醒</h2>
        <p className="text-sm text-neutral-400">
          查看待审核投稿、处理被举报内容、规划新的专题比赛。
        </p>
      </section>
    </div>
  );
}
