'use client';

import { useMemo, useState } from 'react';

import type { UserRole } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useAdminUsers, useUpdateUserRole } from './hooks';

const ROLE_TABS: Array<{ label: string; value?: UserRole }> = [
  { label: '全部', value: undefined },
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' }
];

export function AdminUsersTable() {
  const [role, setRole] = useState<(typeof ROLE_TABS)[number]['value']>();
  const usersQuery = useAdminUsers(role);
  const updateRoleMutation = useUpdateUserRole();

  const users = useMemo(
    () => usersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [usersQuery.data]
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {ROLE_TABS.map((tab) => (
          <Button
            key={tab.label}
            variant={role === tab.value ? 'primary' : 'secondary'}
            className="h-9 rounded-full"
            type="button"
            onClick={() => setRole(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {usersQuery.isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/5">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-white/5 text-neutral-400">
              <tr>
                <th className="px-4 py-3 text-left">用户</th>
                <th className="px-4 py-3 text-left">角色</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="px-4 py-4">
                    <div className="font-medium text-neutral-50">{user.display_name}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      注册于 {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-neutral-400 capitalize">{user.role}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2 text-xs">
                      <Button
                        variant="secondary"
                        className="h-8"
                        type="button"
                        onClick={() =>
                          updateRoleMutation.mutate({
                            userId: user.id,
                            role: user.role === 'admin' ? 'user' : 'admin'
                          })
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        {user.role === 'admin' ? '降为用户' : '设为管理员'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && !usersQuery.isLoading && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-neutral-500">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {usersQuery.hasNextPage && (
        <Button
          variant="secondary"
          className="self-center"
          onClick={() => usersQuery.fetchNextPage()}
          disabled={usersQuery.isFetchingNextPage}
        >
          {usersQuery.isFetchingNextPage ? '加载中…' : '加载更多'}
        </Button>
      )}
    </section>
  );
}
