import { useEffect, useState } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import { fetchAllProfiles } from '@/lib/api';
import type { Profile } from '@/lib/types';
import { Loader, ErrorState, EmptyState } from '@/components/ui/Loader';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllProfiles()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader size="lg" className="py-20" />;
  if (error) return <ErrorState message={error} />;

  const customers = users.filter((u) => u.role === 'customer');
  const admins = users.filter((u) => u.role === 'admin');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-5">
          <p className="font-display text-2xl font-bold text-cream-50">{customers.length}</p>
          <p className="text-xs text-ink-300">Customers</p>
        </div>
        <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-5">
          <p className="font-display text-2xl font-bold text-cream-50">{admins.length}</p>
          <p className="text-xs text-ink-300">Admins</p>
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={<UsersIcon className="h-12 w-12" />} title="No users" message="Registered users will appear here" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-700/50 bg-ink-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-ink-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ember-500/20 text-xs font-bold text-ember-400">
                        {u.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="text-cream-200">{u.name || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === 'admin' ? 'bg-ember-500/15 text-ember-400' : 'bg-ink-700 text-ink-300'}`}>
                      {u.role}
                    </span>
                  </td>
<<<<<<< HEAD
                  <td className="px-4 py-3 text-ink-300 text-xs">{formatDate(u.createdAt || '')}</td>
=======
                  <td className="px-4 py-3 text-ink-300 text-xs">{formatDate(u.created_at)}</td>
>>>>>>> 9a922357087256e67fe5d9e2a66ae9a1e58eec70
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
