import { useEffect, useRef, lazy, Suspense } from 'react';
import { useFormStore } from '../../store/formStore';
import { useAutoSave } from '../../hooks/useAutoSave';
import ProgressBar from './ProgressBar';

// Lazy-load step components to reduce initial bundle size
const Step1LoanType = lazy(() => import('../steps/Step1LoanType'));
const Step2PersonalInfo = lazy(() => import('../steps/Step2PersonalInfo'));
const Step3KYC = lazy(() => import('../steps/Step3KYC'));
const Step4Address = lazy(() => import('../steps/Step4Address'));
const Step5Employment = lazy(() => import('../steps/Step5Employment'));
const Step6CoApplicant = lazy(() => import('../steps/Step6CoApplicant'));
const Step7Documents = lazy(() => import('../steps/Step7Documents'));
const Step8Review = lazy(() => import('../steps/Step8Review'));

const STEP_COMPONENTS = {
  1: Step1LoanType,
  2: Step2PersonalInfo,
  3: Step3KYC,
  4: Step4Address,
  5: Step5Employment,
  6: Step6CoApplicant,
  7: Step7Documents,
  8: Step8Review,
};

export default function Wizard() {
  const {
    currentStep,
    formData,
    setStep,
    getNextStep,
    getPrevStep,
    isSubmitted,
    getStepProgress,
  } = useFormStore();

  const stepContentRef = useRef(null);

  // Auto-save
  useAutoSave(formData, currentStep);

  // Handle browser back/forward button — navigate within wizard instead of leaving page
  useEffect(() => {
    // Push an initial state so we have something to go back to
    window.history.pushState({ step: currentStep }, '');

    const handlePopState = (e) => {
      if (e.state && e.state.step) {
        // User pressed browser back — go to previous wizard step
        const prev = getPrevStep(currentStep);
        if (prev) {
          setStep(prev);
          // Re-push state so back button keeps working
          window.history.pushState({ step: prev }, '');
        } else {
          // Already on step 1 — re-push to prevent leaving the page
          window.history.pushState({ step: currentStep }, '');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep, getPrevStep, setStep]);

  // Move focus to first input on step change
  useEffect(() => {
    if (stepContentRef.current) {
      const firstInput = stepContentRef.current.querySelector(
        'input, select, textarea, button:not([type="button"])'
      );
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    const next = getNextStep(currentStep);
    if (next) {
      // Push new history state for each step advance
      window.history.pushState({ step: next }, '');
      setStep(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    const prev = getPrevStep(currentStep);
    if (prev) {
      setStep(prev);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const StepComponent = STEP_COMPONENTS[currentStep];
  const isLastStep = getNextStep(currentStep) === null;

  if (!StepComponent) return null;

  // Announce step change to screen readers
  const { current: stepCurrent, total: stepTotal } = getStepProgress(currentStep);

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-primary">LendSwift</span>
          </div>
          <p className="text-sm text-gray-500">Digital Loan Application</p>
        </div>

        {/* Progress */}
        {!isSubmitted && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
            <ProgressBar />
          </div>
        )}

        {/* Step Content */}
        <div
          ref={stepContentRef}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in"
          key={currentStep}
          aria-label={`Step ${stepCurrent} of ${stepTotal}`}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center py-16" aria-label="Loading step...">
              <span className="spinner" aria-hidden="true" />
              <span className="sr-only">Loading...</span>
            </div>
          }>
            <StepComponent
              onNext={handleNext}
              onPrev={handlePrev}
            />
          </Suspense>
        </div>

        {/* Footer */}
        {!isSubmitted && (
          <p className="text-center text-xs text-gray-400 mt-4" aria-live="polite">
            🔒 Your data is encrypted and secure. Auto-saved every 30 seconds.
          </p>
        )}
        {isSubmitted && (
          <p className="text-center text-xs text-accent mt-4 font-medium">
            ✅ Application submitted successfully.
          </p>
        )}
      </div>
    </div>
  );
}
