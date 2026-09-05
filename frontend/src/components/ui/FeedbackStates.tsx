import React from 'react';
import { Loader2, Inbox, AlertOctagon } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading land record data...' }) => (
  <div className="flex flex-col items-center justify-center p-12 text-slate-500">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
    <p className="text-sm font-medium text-slate-600">{message}</p>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, actionText, onAction }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
    <div className="p-3 bg-slate-50 rounded-full text-slate-400 mb-3">
      <Inbox className="w-8 h-8" />
    </div>
    <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
      >
        {actionText}
      </button>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({ title = 'Failed to load data', message = 'An error occurred while communicating with the service.', onRetry }) => (
  <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-center">
    <AlertOctagon className="w-8 h-8 text-red-600 mx-auto mb-2" />
    <h4 className="text-sm font-semibold text-red-900 mb-1">{title}</h4>
    <p className="text-xs text-red-700 max-w-md mx-auto mb-3">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded shadow-sm transition"
      >
        Retry
      </button>
    )}
  </div>
);
