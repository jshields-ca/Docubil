import { motion } from 'framer-motion';
import { SEVERITY_META, SEVERITY_ORDER } from '../lib/severity';

export function SeverityCards({ total, totalLabel, bySeverity }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50"
      >
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{total}</p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{totalLabel}</p>
      </motion.div>
      {SEVERITY_ORDER.map((severity, index) => {
        const meta = SEVERITY_META[severity];
        return (
          <motion.div
            key={severity}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index + 1) * 0.05 }}
            className={`rounded-xl border p-4 text-center ${meta.bgClass} ring-1 ${meta.ringClass} border-transparent`}
          >
            <p className={`text-3xl font-bold ${meta.textClass}`}>{bySeverity?.[severity] ?? 0}</p>
            <p className="text-xs font-medium text-slate-600">{meta.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
