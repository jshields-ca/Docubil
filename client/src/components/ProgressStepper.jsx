import { motion } from 'framer-motion';
import clsx from 'clsx';

const STEPS = [
  { key: 'upload', label: 'Upload', icon: '📤' },
  { key: 'analyze', label: 'Analyze', icon: '🔍' },
  { key: 'remediate', label: 'Remediate', icon: '🔧' },
  { key: 'complete', label: 'Complete', icon: '✅' },
];

export function ProgressStepper({ activeStep, percentage, statusText }) {
  const activeIndex = STEPS.findIndex((step) => step.key === activeStep);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
        Processing your PDF
      </h2>

      <ol className="mt-6 flex justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          return (
            <li key={step.key} className="flex flex-1 flex-col items-center gap-2 text-center">
              <span
                aria-hidden="true"
                className={clsx(
                  'flex size-10 items-center justify-center rounded-full text-lg transition-colors',
                  isCompleted && 'bg-minor text-white',
                  isActive && !isCompleted && 'bg-brand-600 text-white',
                  !isActive && !isCompleted && 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                )}
              >
                {step.icon}
              </span>
              <span
                className={clsx(
                  'text-xs font-medium',
                  isActive
                    ? 'text-brand-700 dark:text-brand-400'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {step.label}
                {isActive && <span className="sr-only"> (current step)</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div
        className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Processing progress"
      >
        <motion.div
          className="h-full rounded-full bg-brand-600"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-400">{statusText}</p>
    </div>
  );
}
