import { useId, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useToast } from './ToastProvider';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}

export function UploadCard({ onSubmit, disabled }) {
  const [file, setFile] = useState(null);
  const [wcagLevel, setWcagLevel] = useState('AA');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputId = useId();
  const showToast = useToast();

  function acceptFile(candidate) {
    if (!candidate) return;
    if (candidate.type !== 'application/pdf') {
      showToast('Please select a PDF file.', 'error');
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      showToast('File size must be under 50MB.', 'error');
      return;
    }
    setFile(candidate);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      showToast('Please select a PDF file first.', 'error');
      return;
    }
    onSubmit(file, wcagLevel);
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Upload your PDF</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Upload a PDF document to analyze its accessibility and automatically fix issues where
        possible.
      </p>

      {/*
        A <label> wrapping the (visually hidden) file input is natively
        focusable, keyboard-activatable, and click-activatable with zero
        ARIA -- a role="button" wrapper around a real focusable <input>
        would put two interactive controls in the tab order for the same
        action, which axe flags as "nested-interactive".
      */}
      <label
        htmlFor={fileInputId}
        aria-describedby={`${fileInputId}-hint`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          'mt-6 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500',
          isDragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
            : 'border-slate-300 hover:border-brand-400 dark:border-slate-700'
        )}
      >
        <span aria-hidden="true" className="text-4xl">
          📄
        </span>
        <span className="sr-only">Select PDF file to upload</span>
        <input
          id={fileInputId}
          type="file"
          accept=".pdf"
          className="sr-only"
          onChange={(e) => acceptFile(e.target.files[0])}
        />
        {file ? (
          <p className="font-medium text-slate-900 dark:text-white">
            {file.name} <span className="text-slate-500">({formatFileSize(file.size)})</span>
          </p>
        ) : (
          <p className="text-slate-700 dark:text-slate-300">
            <strong>Drop your PDF here</strong> or{' '}
            <span className="font-medium text-brand-600 dark:text-brand-400">browse files</span>
          </p>
        )}
        <p id={`${fileInputId}-hint`} className="text-xs text-slate-500 dark:text-slate-500">
          Maximum file size: 50MB
        </p>
      </label>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-slate-900 dark:text-white">
          WCAG compliance level
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            {
              value: 'AA',
              title: 'WCAG AA',
              description: 'Standard compliance level required by most regulations',
            },
            {
              value: 'AAA',
              title: 'WCAG AAA',
              description: 'Enhanced compliance with stricter requirements',
            },
          ].map((option) => (
            <label
              key={option.value}
              className={clsx(
                'flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:border-slate-700 dark:has-[:checked]:bg-brand-900/20'
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="wcagLevel"
                  value={option.value}
                  checked={wcagLevel === option.value}
                  onChange={() => setWcagLevel(option.value)}
                  className="size-4 accent-brand-600"
                />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {option.title}
                </span>
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {option.description}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={disabled || !file}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        🔍 Analyze PDF
      </motion.button>
    </motion.form>
  );
}
