import { motion } from 'framer-motion';

export function Header() {
  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-4 py-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-2xl bg-brand-600 text-xl text-white shadow-lg shadow-brand-600/30"
          >
            ♿
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Docubil
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-xl text-balance text-slate-600 dark:text-slate-400"
        >
          Automatically evaluate and remediate PDF accessibility issues, so every document reaches
          every reader.
        </motion.p>
      </div>
    </header>
  );
}
