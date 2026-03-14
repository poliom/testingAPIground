'use client'

import { useEffect, useState, useCallback } from 'react'

interface User {
  id: string
  email: string
  full_name: string | null
  role: 'ADMIN' | 'USER' | 'GUEST'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 border-red-200',
  USER: 'bg-blue-100 text-blue-700 border-blue-200',
  GUEST: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editRoleUserId, setEditRoleUserId] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<string>('USER')
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const totalPages = Math.ceil(total / size)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('You must be logged in as ADMIN to view users.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/users?page=${page}&size=${size}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401 || res.status === 403) {
        setError('Access denied. ADMIN role required.')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [page, size])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRoleChange = async () => {
    if (!editRoleUserId) return
    setActionLoading(true)
    const token = localStorage.getItem('access_token')
    try {
      const res = await fetch(`/api/users/${editRoleUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error('Failed to update role')
      setEditRoleUserId(null)
      fetchUsers()
    } catch (e) {
      alert(String(e))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteUserId) return
    setActionLoading(true)
    const token = localStorage.getItem('access_token')
    try {
      const res = await fetch(`/api/users/${deleteUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete user')
      setDeleteUserId(null)
      fetchUsers()
    } catch (e) {
      alert(String(e))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total users</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">ID</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Full Name</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Role</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Created At</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {user.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-medium">{user.email}</td>
                    <td className="px-6 py-4 text-slate-600">{user.full_name ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[user.role]}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditRoleUserId(user.id)
                            setNewRole(user.role)
                          }}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Edit Role
                        </button>
                        <button
                          onClick={() => setDeleteUserId(user.id)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {editRoleUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Change Role</h3>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 text-slate-800"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
              <option value="GUEST">GUEST</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleRoleChange}
                disabled={actionLoading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {actionLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditRoleUserId(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Delete User</h3>
            <p className="text-slate-500 text-sm mb-4">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteUserId(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
