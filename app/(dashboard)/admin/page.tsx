import { OverviewCards } from '@/features/admin/dashboard/overview-cards';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <OverviewCards />

      <section className="grid gap-4 rounded-3xl border border-white/5 bg-neutral-900/50 p-6">
        <h2 className="text-lg font-semibold text-neutral-100">操作指引</h2>
        <p className="text-sm text-neutral-400">
          管理帖子、用户与比赛。如需审核投稿，请在比赛详情中查看参赛作品列表。
        </p>
      </section>
    </div>
  );
}
