import { useFormStore } from '../../store/formStore';
import Button from '../common/Button';

export default function StepNavigation({
  onNext,
  onPrev,
  isLastStep = false,
  isSubmitting = false,
  canProceed = true,
  nextLabel,
}) {
  const { currentStep, getPrevStep } = useFormStore();
  const prevStep = getPrevStep(currentStep);

  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
      <div>
        {prevStep && (
          <Button
            variant="secondary"
            onClick={onPrev}
            type="button"
            className="gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isLastStep ? (
          <Button
            variant="success"
            type="submit"
            isLoading={isSubmitting}
            disabled={!canProceed || isSubmitting}
            size="lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Submit Application
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onNext}
            type="button"
            disabled={!canProceed}
            className="gap-2"
          >
            {nextLabel || 'Continue'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}
