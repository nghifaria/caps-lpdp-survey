import type { Database } from '../../types/database'
import LoadingSpinner from '../LoadingSpinner'

export type UserRole = Database['public']['Tables']['profiles']['Row']['role']

export type AdminUserRow = {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  updated_at: string
}

interface ScholarsTableProps {
  users: AdminUserRow[]
  usersLoading: boolean
  usersError: string | null
  currentUserId: string | null
  updatingRoleId: string | null
  handleRoleChange: (userId: string, nextRole: UserRole) => void
}

export default function ScholarsTable({
  users,
  usersLoading,
  usersError,
  currentUserId,
  updatingRoleId,
  handleRoleChange,
}: ScholarsTableProps) {
  return (
    <div className="space-y-6 print:hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-oren">
            Daftar Pengguna
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ash">
            Manajemen Pengguna
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ash/80">
            Kelola peran pengguna tanpa akses manual ke database.
          </p>
        </div>
      </div>

      {usersLoading ? (
        <div className="mt-5">
          <LoadingSpinner />
        </div>
      ) : usersError ? (
        <p className="mt-5 text-sm text-red-600">{usersError}</p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-[#E7E4DC] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E7E4DC] text-left text-sm">
              <thead className="bg-[#E7E4DC]/55 text-xs uppercase tracking-[0.16em] text-ash/70">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E4DC]">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#fff9eb]/50 transition-colors duration-200"
                  >
                    <td className="px-4 py-3 font-medium text-ash">
                      {user.full_name || '-'}
                      {user.id === currentUserId ? (
                        <span className="ml-2 rounded-xl bg-oren/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-oren">
                          You
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ash/80">{user.email ?? '-'}</td>
                    <td className="px-4 py-3 text-ash/80">
                      <span className="rounded-xl bg-[#F5E8C6]/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ash/90">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ash/80">
                      <select
                        value={user.role}
                        disabled={user.id === currentUserId || updatingRoleId === user.id}
                        onChange={(event) =>
                          void handleRoleChange(user.id, event.target.value as UserRole)
                        }
                        className="rounded-xl border border-[#E7E4DC] bg-white px-3 py-2 text-sm text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        <option value="awardee">awardee</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
