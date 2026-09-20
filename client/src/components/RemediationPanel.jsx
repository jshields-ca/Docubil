import { useState } from 'react';
import { motion } from 'framer-motion';
import { SeverityCards } from './SeverityCards';
import { reportUrl, downloadUrl } from '../lib/api';

function Accordion({ title, count, tone, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left font-medium text-slate-900 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-white dark:hover:bg-slate-800/60"
      >
        <span>
          {title} <span className={`font-normal ${tone}`}>({count})</span>
        </span>
        <motion.span
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▾
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="space-y-2 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function RemediationPanel({ jobId, result, onStartOver }) {
  const fixed = result.fixedIssuesDetail ?? [];
  const remaining = result.remainingIssuesDetail ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
        Remediation complete
      </h2>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-minor-bg p-4 text-center ring-1 ring-minor/20">
          <p className="text-3xl font-bold text-minor">{result.fixedIssues}</p>
          <p className="text-xs font-medium text-slate-600">Fixed</p>
        </div>
        <div className="rounded-xl bg-moderate-bg p-4 text-center ring-1 ring-moderate/20">
          <p className="text-3xl font-bold text-moderate">{result.remainingIssues}</p>
          <p className="text-xs font-medium text-slate-600">Manual review</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/50">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {result.originalIssues}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Original</p>
        </div>
      </div>

      {result.remainingBySeverity && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Remaining issues by severity
          </p>
          <SeverityCards
            total={result.remainingIssues}
            totalLabel="Remaining"
            bySeverity={result.remainingBySeverity}
          />
        </div>
      )}

      {(fixed.length > 0 || remaining.length > 0) && (
        <div className="mt-6 space-y-3">
          {fixed.length > 0 && (
            <Accordion title="What was fixed" count={fixed.length} tone="text-minor">
              {fixed.map((issue) => (
                <div key={issue.id}>
                  <p className="font-medium text-slate-900 dark:text-white">{issue.title}</p>
                  <p className="text-slate-600 dark:text-slate-400">{issue.fixApplied}</p>
                </div>
              ))}
            </Accordion>
          )}
          {remaining.length > 0 && (
            <Accordion title="Needs manual review" count={remaining.length} tone="text-moderate">
              {remaining.map((issue) => (
                <div key={issue.id}>
                  <p className="font-medium text-slate-900 dark:text-white">{issue.title}</p>
                  <p className="text-slate-600 dark:text-slate-400">{issue.reason}</p>
                </div>
              ))}
            </Accordion>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href={reportUrl(jobId)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          📊 View final report
        </a>
        {result.downloadUrl && (
          <a
            href={downloadUrl(jobId)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-minor px-5 py-3 font-semibold text-white shadow-lg shadow-minor/25 transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            💾 Download remediated PDF
          </a>
        )}
        <button
          type="button"
          onClick={onStartOver}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          🔄 Analyze another PDF
        </button>
      </div>
    </motion.div>
  );
}
