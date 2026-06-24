'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { formatDateForInput } from '@/lib/utils';


export default function PreorderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    name: '',
    products: 1,
    preorderWhen: 'regardless-of-stock',
    startsAt: new Date().toISOString().slice(0, 16),
    endsAt: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch preorder if editing
  useEffect(() => {
    if (isNew) return;

    const fetchPreorder = async () => {
      try {
        const response = await fetch(`/api/preorders/${id}`);
        if (!response.ok) throw new Error('Failed to fetch preorder');

        const result = await response.json();
        if (!result.success) throw new Error(result.error?.message || 'Failed to fetch preorder');
        
        const preorder = result.data;
        setFormData({
          name: preorder.name,
          products: preorder.products,
          preorderWhen: preorder.preorderWhen,
          startsAt: preorder.startsAt ? formatDateForInput(new Date(preorder.startsAt)) : '',
          endsAt: preorder.endsAt ? formatDateForInput(new Date(preorder.endsAt)) : '',
          isActive: preorder.isActive,
        });
      } catch (err) {
        console.error('Error fetching preorder:', err);
        setError('Failed to load preorder');
      } finally {
        setLoading(false);
      }
    };

    fetchPreorder();
  }, [id, isNew]);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Format input date to ISO string
// Format input date to ISO string
const formatInputToISO = (dateString: string): string | null => {
  if (!dateString) return null;
  
  // Handle both formats: 'YYYY-MM-DDTHH:mm' (datetime-local) and 'mm/dd/yyyy, HH:mm' (custom)
  let date: Date;
  
  if (dateString.includes('T')) {
    // It's in datetime-local format
    date = new Date(dateString);
  } else {
    // It's in the custom format: 'mm/dd/yyyy, HH:mm'
    const [datePart, timePart] = dateString.split(', ');
    if (!datePart || !timePart) return null;
    
    const [month, day, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    
    if (!month || !day || !year || !hours || !minutes) return null;
    
    date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
  }
  
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
};

  // Handle save
const handleSave = async () => {
  setSaving(true);
  setError(null);

  try {
    const payload = {
      name: formData.name,
      products: parseInt(formData.products.toString()),
      preorderWhen: formData.preorderWhen,
      startsAt:
        formatInputToISO(formData.startsAt) || new Date().toISOString(),
      endsAt: formData.endsAt
        ? formatInputToISO(formData.endsAt)
        : null,
      isActive: formData.isActive,
    };

    const url = isNew
      ? '/api/preorders'
      : `/api/preorders/${id}`;

    const method = isNew ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error?.message ||
          result?.message ||
          `Request failed with status ${response.status}`
      );
    }

    if (!result.success) {
      throw new Error(
        result?.error?.message ||
          result?.message ||
          'Failed to save preorder'
      );
    }

    router.push('/');
  } catch (err) {
    console.error('Error saving preorder:', err);

    setError(
      err instanceof Error
        ? err.message
        : 'Failed to save preorder. Please try again.'
    );
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 text-white rounded font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              Save changes
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Section Title */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900">Preorder details</h2>
            <p className="text-sm text-gray-600">These values appear in the preorders list.</p>
          </div>

          {/* Name Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-2">A label to recognize this preorder by.</p>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Multi variant 3"
              className="w-full px-3 py-2 border border-gray-300 rounded font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Products Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">Products</label>
            <p className="text-xs text-gray-600 mb-2">
              Number of products covered by this preorder.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="products"
                value={formData.products}
                onChange={handleChange}
                min="1"
                className="w-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-600">product(s)</span>
            </div>
          </div>

          {/* Preorder When Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Preorder when
            </label>
            <p className="text-xs text-gray-600 mb-2">
              When customers are allowed to preorder.
            </p>
            <select
              name="preorderWhen"
              value={formData.preorderWhen}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="regardless-of-stock">Regardless of stock</option>
              <option value="out-of-stock">Out of stock</option>
              <option value="back-in-stock">Back in stock</option>
            </select>
          </div>

          {/* Starts At Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Starts at <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-2">When the preorder window opens.</p>
            <input
              type="datetime-local"
              name="startsAt"
              value={formData.startsAt}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Ends At Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">Ends at</label>
            <p className="text-xs text-gray-600 mb-2">Leave empty for no end date.</p>
            <input
              type="datetime-local"
              name="endsAt"
              value={formData.endsAt}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Status Field */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
            <p className="text-xs text-gray-600 mb-4">Active preorders are visible to customers.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  formData.isActive ? 'bg-gray-900' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    formData.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-900">
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 text-white rounded font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
