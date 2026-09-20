import { motion } from 'framer-motion';
import { SeverityCards } from './SeverityCards';
import { reportUrl } from '../lib/api';

export function ResultsPanel({ result, onRemediate, remediating }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Analysis complete</h2>

      <div className="mt-5">
        <SeverityCards
          total={result.issues}
          totalLabel="Total issues"
          bySeverity={result.issuesBySeverity}
        />
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3 dark:bg-slate-800/50">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Job ID</dt>
          <dd className="truncate font-mono text-xs text-slate-800 dark:text-slate-200">
            {result.jobId}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Status</dt>
          <dd className="font-medium text-slate-800 capitalize dark:text-slate-200">
            {result.status}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Analysis engine</dt>
          <dd className="font-medium text-slate-800 dark:text-slate-200">
            {result.pythonEnhanced ? 'Python-enhanced' : 'Basic heuristics'}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href={reportUrl(result.jobId)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          📊 View detailed report
        </a>
        <button
          type="button"
          onClick={onRemediate}
          disabled={remediating}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          🔧 {remediating ? 'Remediating…' : 'Auto-remediate issues'}
        </button>
      </div>
    </motion.div>
  );
}
