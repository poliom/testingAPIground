'use client'

import { useEffect, useState, useCallback } from 'react'

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
}

interface Order {
  id: string
  user_id: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  notes: string | null
  items?: OrderItem[]
  created_at: string
  updated_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const ALL_STATUSES = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(10)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<Order | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<string>('pending')

  const totalPages = Math.ceil(total / size)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('You must be logged in to view orders.')
      setLoading(false)
      return
    }

    try {
      const params = new URLSearchParams({ page: String(page), size: String(size) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)

      const res = await fetch(`/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message ?? 'Failed to fetch orders')
        return
      }

      const data = await res.json()
      setOrders(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [page, size, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleExpand = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null)
      setExpandedOrder(null)
      return
    }

    setExpandedId(orderId)
    setLoadingDetail(true)
    const token = localStorage.getItem('access_token')

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setExpandedOrder(data)
      }
    } catch {
      // ignore
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setActionLoading(true)
    const token = localStorage.getItem('access_token')
    try {
      const res = await fetch(`/api/orders/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.message ?? 'Failed to delete order')
        return
      }
      setDeleteId(null)
      fetchOrders()
    } catch (e) {
      alert(String(e))
    } finally {
      setActionLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!editOrder) return
    setActionLoading(true)
    const token = localStorage.getItem('access_token')
    try {
      const res = await fetch(`/api/orders/${editOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.message ?? 'Failed to update status')
        return
      }
      setEditOrder(null)
      fetchOrders()
    } catch (e) {
      alert(String(e))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
        <p className="text-slate-500 text-sm mt-1">{total} total orders</p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
          >
            Clear dates
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Order ID</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">User</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Total</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Date</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No orders found</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <>
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                        {order.user_id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-semibold">
                        ${Number(order.total_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleExpand(order.id)}
                            className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            {expandedId === order.id ? 'Hide' : 'Details'}
                          </button>
                          <button
                            onClick={() => { setEditOrder(order); setNewStatus(order.status) }}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            Status
                          </button>
                          <button
                            onClick={() => setDeleteId(order.id)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={6} className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                          {loadingDetail ? (
                            <span className="text-slate-400 text-sm">Loading items...</span>
                          ) : expandedOrder ? (
                            <div>
                              {expandedOrder.notes && (
                                <p className="text-sm text-slate-600 mb-3">
                                  <strong>Notes:</strong> {expandedOrder.notes}
                                </p>
                              )}
                              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                Order Items ({expandedOrder.items?.length ?? 0})
                              </h4>
                              <div className="space-y-1">
                                {expandedOrder.items?.map((item) => (
                                  <div key={item.id} className="flex items-center gap-4 text-sm">
                                    <span className="text-slate-400 font-mono text-xs">{item.product_id.slice(0, 8)}...</span>
                                    <span className="text-slate-600">Qty: {item.quantity}</span>
                                    <span className="text-slate-600">Unit: ${Number(item.unit_price).toFixed(2)}</span>
                                    <span className="text-slate-800 font-medium">
                                      Total: ${(item.quantity * item.unit_price).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
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

      {/* Edit Status Modal */}
      {editOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Update Order Status</h3>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 text-slate-800"
            >
              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleStatusUpdate}
                disabled={actionLoading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {actionLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditOrder(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Delete Order</h3>
            <p className="text-slate-500 text-sm mb-4">
              Are you sure you want to delete this order? This cannot be undone.
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
                onClick={() => setDeleteId(null)}
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
