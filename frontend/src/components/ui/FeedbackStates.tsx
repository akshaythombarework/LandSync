import React from 'react';
import { Loader2, Inbox, AlertTriangle } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center p-12 text-slate-400">
    <Loader2 className="w-6 h-6 animate-spin text-[#0F766E] mb-2" />
    <p className="text-xs text-slate-500">{message}</p>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, actionText, onAction }) => (
  <div className="flex flex-col items-center justify-center p-10 text-center">
    <Inbox className="w-8 h-8 text-slate-300 mb-3" />
    <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
    <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="px-3.5 py-1.5 text-xs font-semibold rounded bg-[#0F766E] hover:bg-[#0d6460] text-white transition cursor-pointer"
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
}> = ({ title = 'Failed to load data', message = 'An error occurred while communicating with the data service.', onRetry }) => (
  <div className="p-4 bg-rose-50 rounded border border-rose-200 text-center">
    <AlertTriangle className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
    <h4 className="text-sm font-semibold text-rose-900 mb-1">{title}</h4>
    <p className="text-xs text-rose-700 max-w-md mx-auto mb-2">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1 text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white rounded transition cursor-pointer"
      >
        Retry
      </button>
    )}
  </div>
);
