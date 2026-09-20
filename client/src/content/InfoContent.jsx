const H3 = ({ children }) => (
  <h3 className="mt-4 mb-2 text-base font-semibold text-slate-900 first:mt-0 dark:text-white">
    {children}
  </h3>
);

const UL = ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>;
const OL = ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>;

export function AboutContent() {
  return (
    <>
      <p>
        Docubil evaluates PDF documents for accessibility and automatically remediates what it
        safely can, so everyone has equal access to data, forms, and PDF-based documents.
      </p>
      <H3>Features</H3>
      <UL>
        <li>Automated accessibility analysis against WCAG 2.1</li>
        <li>AA and AAA compliance checking</li>
        <li>Automatic remediation of common structural issues</li>
        <li>Detailed, downloadable accessibility reports</li>
      </UL>
      <H3>Supported standards</H3>
      <UL>
        <li>WCAG 2.1 AA — required by most accessibility regulations</li>
        <li>WCAG 2.1 AAA — enhanced accessibility</li>
        <li>PDF/UA compatibility checks</li>
      </UL>
    </>
  );
}

export function HelpContent() {
  return (
    <>
      <H3>How to use Docubil</H3>
      <OL>
        <li>Upload a PDF (max 50MB)</li>
        <li>Choose a WCAG compliance level</li>
        <li>Click Analyze and review the report</li>
        <li>Run auto-remediation to fix what can be fixed automatically</li>
        <li>Download your improved PDF</li>
      </OL>
      <H3>Fixed automatically</H3>
      <UL>
        <li>Missing document metadata (title, subject, language)</li>
        <li>Document tagging flags and viewer preferences</li>
        <li>Form field accessible tooltips</li>
      </UL>
      <H3>Needs manual review</H3>
      <UL>
        <li>Alternative text for images</li>
        <li>Color contrast corrections</li>
        <li>Reading order and heading structure</li>
      </UL>
    </>
  );
}

export function PrivacyContent() {
  return (
    <>
      <p>
        Docubil processes your PDF entirely within its own server process — nothing is sent to a
        third party.
      </p>
      <H3>Data handling</H3>
      <UL>
        <li>Uploaded and generated files are deleted automatically after a retention window</li>
        <li>No file content is used for anything other than the analysis you requested</li>
        <li>Processing logs are minimal and temporary</li>
      </UL>
      <p className="mt-4">
        See{' '}
        <a
          href="https://github.com/jshields-ca/Docubil/blob/main/SECURITY.md"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-brand-600 underline hover:text-brand-700 dark:text-brand-400"
        >
          SECURITY.md
        </a>{' '}
        for the full policy.
      </p>
    </>
  );
}
