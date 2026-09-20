import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UploadCard } from './components/UploadCard';
import { ProgressStepper } from './components/ProgressStepper';
import { ResultsPanel } from './components/ResultsPanel';
import { RemediationPanel } from './components/RemediationPanel';
import { InfoDialog } from './components/InfoDialog';
import { AboutContent, HelpContent, PrivacyContent } from './content/InfoContent';
import { useToast } from './components/ToastProvider';
import { analyzePdf, remediatePdf } from './lib/api';

const PANEL_TRANSITION = { duration: 0.25 };
const PANEL_VARIANTS = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

export default function App() {
  const [step, setStep] = useState('upload');
  const [progress, setProgress] = useState({ activeStep: 'upload', percentage: 0, text: '' });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [remediationResult, setRemediationResult] = useState(null);
  const [dialog, setDialog] = useState(null);
  const showToast = useToast();

  async function handleAnalyze(file, wcagLevel) {
    setStep('progress');
    setProgress({ activeStep: 'upload', percentage: 20, text: 'Uploading PDF…' });

    try {
      setTimeout(
        () => setProgress({ activeStep: 'analyze', percentage: 60, text: 'Analyzing accessibility…' }),
        350
      );
      const result = await analyzePdf(file, wcagLevel);
      setProgress({ activeStep: 'analyze', percentage: 100, text: 'Analysis complete!' });
      setAnalysisResult(result);
      setTimeout(() => setStep('results'), 400);
    } catch (error) {
      showToast(`Upload failed: ${error.message}`, 'error');
      setStep('upload');
    }
  }

  async function handleRemediate() {
    if (!analysisResult) return;
    setStep('progress');
    setProgress({ activeStep: 'remediate', percentage: 30, text: 'Applying automatic fixes…' });

    try {
      const result = await remediatePdf(analysisResult.jobId, true);
      setProgress({ activeStep: 'complete', percentage: 100, text: 'Remediation complete!' });
      setRemediationResult(result);
      setTimeout(() => setStep('remediated'), 400);
    } catch (error) {
      showToast(`Remediation failed: ${error.message}`, 'error');
      setStep('results');
    }
  }

  function handleStartOver() {
    setAnalysisResult(null);
    setRemediationResult(null);
    setProgress({ activeStep: 'upload', percentage: 0, text: '' });
    setStep('upload');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />

      <main id="main-content" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div key="upload" {...PANEL_VARIANTS} transition={PANEL_TRANSITION}>
              <UploadCard onSubmit={handleAnalyze} />
            </motion.div>
          )}

          {step === 'progress' && (
            <motion.div key="progress" {...PANEL_VARIANTS} transition={PANEL_TRANSITION}>
              <ProgressStepper
                activeStep={progress.activeStep}
                percentage={progress.percentage}
                statusText={progress.text}
              />
            </motion.div>
          )}

          {step === 'results' && analysisResult && (
            <motion.div key="results" {...PANEL_VARIANTS} transition={PANEL_TRANSITION}>
              <ResultsPanel result={analysisResult} onRemediate={handleRemediate} />
            </motion.div>
          )}

          {step === 'remediated' && remediationResult && (
            <motion.div key="remediated" {...PANEL_VARIANTS} transition={PANEL_TRANSITION}>
              <RemediationPanel
                jobId={analysisResult.jobId}
                result={remediationResult}
                onStartOver={handleStartOver}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer
        onAbout={() => setDialog('about')}
        onHelp={() => setDialog('help')}
        onPrivacy={() => setDialog('privacy')}
      />

      <InfoDialog open={dialog === 'about'} onClose={() => setDialog(null)} title="About Docubil">
        <AboutContent />
      </InfoDialog>
      <InfoDialog open={dialog === 'help'} onClose={() => setDialog(null)} title="Help & instructions">
        <HelpContent />
      </InfoDialog>
      <InfoDialog open={dialog === 'privacy'} onClose={() => setDialog(null)} title="Privacy & security">
        <PrivacyContent />
      </InfoDialog>
    </div>
  );
}
