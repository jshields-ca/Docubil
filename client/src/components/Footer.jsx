export function Footer({ onAbout, onHelp, onPrivacy }) {
  return (
    <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 text-sm text-slate-500 sm:flex-row sm:justify-between dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} Docubil. Built for universal access.</p>
        <nav aria-label="Footer" className="flex gap-5">
          <button type="button" onClick={onAbout} className="hover:text-brand-600 hover:underline">
            About
          </button>
          <button type="button" onClick={onHelp} className="hover:text-brand-600 hover:underline">
            Help
          </button>
          <button
            type="button"
            onClick={onPrivacy}
            className="hover:text-brand-600 hover:underline"
          >
            Privacy
          </button>
        </nav>
      </div>
    </footer>
  );
}
