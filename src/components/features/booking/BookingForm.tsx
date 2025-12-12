import React from 'react';
import { Clock, DollarSign, FileText } from 'lucide-react';
import { useBookingStore } from '@/stores/useBookingStore';
import { BookingEntryRow } from './BookingEntryRow';

interface Props {
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const BookingForm: React.FC<Props> = ({ onSaveDraft, onSubmit, isSubmitting }) => {
  const {
    form,
    updateFormField,
    toggleEntryBillable,
    updateEntryDescription,
    removeEntry,
    getFormTotals,
  } = useBookingStore();

  if (!form) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No form data available</p>
      </div>
    );
  }

  const totals = getFormTotals();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Project & Client Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Project Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client Name
            </label>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => updateFormField('clientName', e.target.value)}
              placeholder="e.g., Acme Corp"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={form.projectName}
              onChange={(e) => updateFormField('projectName', e.target.value)}
              placeholder="e.g., Website Redesign"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hourly Rate
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.hourlyRate}
                onChange={(e) => updateFormField('hourlyRate', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                {form.currency}/h
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Currency
            </label>
            <select
              value={form.currency}
              onChange={(e) => updateFormField('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="CHF">CHF</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Description
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Summary
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => updateFormField('description', e.target.value)}
              placeholder="e.g., Software Development Services"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateFormField('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Time Entries */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Time Entries
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {form.entries.length} {form.entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {form.entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p>No time entries selected</p>
          </div>
        ) : (
          <div className="space-y-2">
            {form.entries.map((entry) => (
              <BookingEntryRow
                key={entry.timeTrackingUuid}
                entry={entry}
                onToggleBillable={toggleEntryBillable}
                onUpdateDescription={updateEntryDescription}
                onRemove={removeEntry}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Summary
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Clock size={16} />
              <span className="text-sm">Total Time</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDuration(totals.totalSeconds)}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <DollarSign size={16} />
              <span className="text-sm">Billable</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatDuration(totals.billableSeconds)}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <span className="text-sm">Total Amount</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totals.totalAmount, form.currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSubmitting || form.entries.length === 0}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save as Draft
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || form.entries.length === 0}
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Creating...
            </>
          ) : (
            'Create Booking'
          )}
        </button>
      </div>
    </div>
  );
};
