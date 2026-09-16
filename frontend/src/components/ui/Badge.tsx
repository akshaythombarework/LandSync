import React from 'react';
import { DocumentStatus, ValidationSeverity } from '../../types';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

// Document Status Badge
export const StatusBadge: React.FC<{ status: DocumentStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const base = 'inline-flex items-center font-semibold rounded border';
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

  switch (status) {
    case 'APPROVED':
      return (
        <span className={`${base} ${sizeClasses} bg-gov-50 text-gov-800 border-gov-300`}>
          <CheckCircle2 className="w-3 h-3 mr-1 text-gov-700 shrink-0" /> Approved
        </span>
      );
    case 'REVIEW_REQUIRED':
      return (
        <span className={`${base} ${sizeClasses} bg-amber-50 text-amber-800 border-amber-300`}>
          <AlertTriangle className="w-3 h-3 mr-1 text-amber-700 shrink-0" /> Review Required
        </span>
      );
    case 'PROCESSING':
      return (
        <span className={`${base} ${sizeClasses} bg-blue-50 text-blue-800 border-blue-200`}>
          <Clock className="w-3 h-3 mr-1 text-blue-600 shrink-0" /> Processing
        </span>
      );
    case 'VALIDATION_PENDING':
      return (
        <span className={`${base} ${sizeClasses} bg-slate-100 text-slate-700 border-slate-300`}>
          <Clock className="w-3 h-3 mr-1 text-slate-500 shrink-0" /> Validation Pending
        </span>
      );
    case 'REJECTED':
      return (
        <span className={`${base} ${sizeClasses} bg-rose-50 text-rose-800 border-rose-300`}>
          <XCircle className="w-3 h-3 mr-1 text-rose-600 shrink-0" /> Rejected
        </span>
      );
    case 'FAILED':
      return (
        <span className={`${base} ${sizeClasses} bg-red-50 text-red-800 border-red-300`}>
          <XCircle className="w-3 h-3 mr-1 text-red-600 shrink-0" /> Failed
        </span>
      );
    case 'UPLOADED':
    default:
      return (
        <span className={`${base} ${sizeClasses} bg-slate-100 text-slate-600 border-slate-200`}>
          Uploaded
        </span>
      );
  }
};

// Field Confidence Badge — no icons, tighter
export const ConfidenceBadge: React.FC<{ confidence: number; showLabel?: boolean }> = ({ confidence, showLabel = true }) => {
  if (confidence >= 90) {
    return (
      <span className="inline-flex items-center font-semibold text-[11px] px-1.5 py-0.5 rounded bg-gov-50 text-gov-800 border border-gov-200">
        {confidence}%{showLabel && ' · High'}
      </span>
    );
  } else if (confidence >= 70) {
    return (
      <span className="inline-flex items-center font-semibold text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
        {confidence}%{showLabel && ' · Med'}
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center font-semibold text-[11px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
        {confidence}%{showLabel && ' · Review'}
      </span>
    );
  }
};

// Validation Severity Badge
export const SeverityBadge: React.FC<{ severity: ValidationSeverity }> = ({ severity }) => {
  switch (severity) {
    case 'critical':
      return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-900 border border-red-300 rounded">CRITICAL</span>;
    case 'error':
      return <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-900 border border-rose-300 rounded">ERROR</span>;
    case 'warning':
      return <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 rounded">WARNING</span>;
    case 'info':
    default:
      return <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-300 rounded">INFO</span>;
  }
};
