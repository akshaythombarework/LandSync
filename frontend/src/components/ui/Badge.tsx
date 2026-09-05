import React from 'react';
import { DocumentStatus, ValidationSeverity } from '../../types';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

// Document Status Badge
export const StatusBadge: React.FC<{ status: DocumentStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'APPROVED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Approved
        </span>
      );
    case 'REVIEW_REQUIRED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" /> Review Required
        </span>
      );
    case 'PROCESSING':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
          <Clock className="w-3 h-3 mr-1 animate-spin text-blue-500" /> Processing
        </span>
      );
    case 'VALIDATION_PENDING':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}>
          <Clock className="w-3 h-3 mr-1 text-indigo-500" /> Validation Pending
        </span>
      );
    case 'REJECTED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <XCircle className="w-3 h-3 mr-1 text-rose-500" /> Rejected
        </span>
      );
    case 'FAILED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-red-50 text-red-700 border border-red-200 ${sizeClasses}`}>
          <XCircle className="w-3 h-3 mr-1 text-red-500" /> Failed
        </span>
      );
    case 'UPLOADED':
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          Uploaded
        </span>
      );
  }
};

// Field Confidence Badge
export const ConfidenceBadge: React.FC<{ confidence: number; showLabel?: boolean }> = ({ confidence, showLabel = true }) => {
  if (confidence >= 90) {
    return (
      <span className="inline-flex items-center font-semibold text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
        {confidence}% {showLabel && '• High'}
      </span>
    );
  } else if (confidence >= 70) {
    return (
      <span className="inline-flex items-center font-semibold text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />
        {confidence}% {showLabel && '• Med'}
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center font-bold text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 animate-pulse">
        <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
        {confidence}% {showLabel && '• Review Needed'}
      </span>
    );
  }
};

// Validation Severity Badge
export const SeverityBadge: React.FC<{ severity: ValidationSeverity }> = ({ severity }) => {
  switch (severity) {
    case 'critical':
      return <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-800 rounded">CRITICAL</span>;
    case 'error':
      return <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 rounded">ERROR</span>;
    case 'warning':
      return <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">WARNING</span>;
    case 'info':
    default:
      return <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">INFO</span>;
  }
};
