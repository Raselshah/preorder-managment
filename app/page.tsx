'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate, clsx } from '@/lib/utils';

interface Preorder {
  id: number;
  name: string;
  products: number;
  preorderWhen: string;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

type Filter = 'all' | 'active' | 'inactive';
type SortBy = 'name' | 'createdAt' | 'startsAt' | 'endsAt';
type SortOrder = 'asc' | 'desc';

export default function PreorderListPage() {
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch preorders
  const fetchPreorders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        filter,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/preorders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch preorders');

      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch preorders');
      
      setPreorders(result.data.items);
      setPagination(result.data.pagination);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error fetching preorders:', error);
      setFeedback({ type: 'error', message: 'Failed to load preorders' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreorders();
  }, [filter, sortBy, sortOrder, page]);

  // Handle filter change
  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter);
    setPage(1);
    setSelectedIds(new Set());
  };

  // Handle sort change
  const handleSortChange = (newSortBy: SortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setShowSortMenu(false);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Handle row checkbox
  const handleRowCheckbox = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedIds.size === preorders.length && preorders.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(preorders.map((p) => p.id)));
    }
  };

  // Toggle preorder status
  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/preorders/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed to update status');
      
      setPreorders(preorders.map((p) => (p.id === id ? result.data : p)));
      setFeedback({
        type: 'success',
        message: `Preorder marked as ${!currentStatus ? 'Active' : 'Inactive'}`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Error toggling status:', error);
      setFeedback({ type: 'error', message: 'Failed to update status' });
    }
  };

  // Delete preorder
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this preorder?')) return;

    try {
      const response = await fetch(`/api/preorders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete preorder');

      setPreorders(preorders.filter((p) => p.id !== id));
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setFeedback({ type: 'success', message: 'Preorder deleted successfully' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Error deleting preorder:', error);
      setFeedback({ type: 'error', message: 'Failed to delete preorder' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Preorders</h1>
          <Link
            href="/preorder/new"
            className="bg-gray-900 text-white px-4 py-2 rounded font-medium hover:bg-gray-800 transition"
          >
            Create Preorder
          </Link>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={clsx(
              'mb-4 p-3 rounded',
              feedback.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            )}
          >
            {feedback.message}
          </div>
        )}

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              {(['all', 'active', 'inactive'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={clsx(
                    'px-3 py-1 rounded font-medium transition',
                    filter === f
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4M17 20v-4m0 0l4 4m-4-4l-4 4"
                  />
                </svg>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                  <div className="p-2">
                    <div className="text-sm font-semibold text-gray-700 px-2 py-1">
                      Sort by
                    </div>
                    {(['name', 'createdAt', 'startsAt', 'endsAt'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSortChange(s)}
                        className={clsx(
                          'w-full text-left px-2 py-1 rounded text-sm',
                          sortBy === s
                            ? 'bg-gray-200 font-semibold'
                            : 'hover:bg-gray-100'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={sortBy === s}
                            readOnly
                            className="w-3 h-3"
                          />
                          <span>
                            {s === 'createdAt'
                              ? 'Created At'
                              : s === 'startsAt'
                              ? 'Starts At'
                              : s === 'endsAt'
                              ? 'Ends At'
                              : 'Name'}
                          </span>
                        </div>
                      </button>
                    ))}

                    <div className="border-t border-gray-200 my-2 pt-2">
                      <button
                        onClick={toggleSortOrder}
                        className="w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {sortOrder === 'asc' ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          )}
                        </svg>
                        <span>
                          {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === preorders.length && preorders.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700">
                  Products
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700">
                  Preorder when
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700">
                  Starts at
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700">
                  Ends at
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : preorders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No preorders found
                  </td>
                </tr>
              ) : (
                preorders.map((preorder) => (
                  <tr key={preorder.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(preorder.id)}
                        onChange={() => handleRowCheckbox(preorder.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {preorder.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {preorder.products}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {preorder.preorderWhen}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(new Date(preorder.startsAt))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {preorder.endsAt ? formatDate(new Date(preorder.endsAt)) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(preorder.id, preorder.isActive)}
                        className={clsx(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition',
                          preorder.isActive ? 'bg-gray-900' : 'bg-gray-300'
                        )}
                      >
                        <span
                          className={clsx(
                            'inline-block h-4 w-4 transform rounded-full bg-white transition',
                            preorder.isActive ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <Link
                        href={`/preorder/${preorder.id}`}
                        className="p-2 hover:bg-gray-200 rounded transition"
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(preorder.id)}
                        className="p-2 hover:bg-red-100 rounded transition text-red-600"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-4 flex justify-center items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>

            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </div>

            <button
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>

            <div className="text-sm text-gray-600 ml-4">
              Showing 1 to {Math.min(preorders.length, pagination.limit)} from {pagination.total}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
