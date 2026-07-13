import { useEffect, useRef } from 'react';
import { useFormStore } from '../../store/formStore';
import { useAutoSave } from '../../hooks/useAutoSave';
import ProgressBar from './ProgressBar';
import Step1LoanType from '../steps/Step1LoanType';
import Step2PersonalInfo from '../steps/Step2PersonalInfo';
import Step3KYC from '../steps/Step3KYC';
import Step4Address from '../steps/Step4Address';
import Step5Employment from '../steps/Step5Employment';
import Step6CoApplicant from '../steps/Step6CoApplicant';
import Step7Documents from '../steps/Step7Documents';
import Step8Review from '../steps/Step8Review';

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
        >
          <StepComponent
            onNext={handleNext}
            onPrev={handlePrev}
          />
        </div>

        {/* Footer */}
        {!isSubmitted && (
          <p className="text-center text-xs text-gray-400 mt-4">
            🔒 Your data is encrypted and secure. Auto-saved every 30 seconds.
          </p>
        )}
      </div>
    </div>
  );
}
