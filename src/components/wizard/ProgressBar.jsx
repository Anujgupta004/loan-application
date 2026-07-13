import { useFormStore } from '../../store/formStore';
import { STEP_LABELS } from '../../utils/constants';

export default function ProgressBar() {
  const { currentStep, completedSteps, getEffectiveSteps } = useFormStore();
  const effectiveSteps = getEffectiveSteps();
  const currentIdx = effectiveSteps.indexOf(currentStep);
  const progressPercent = Math.round((currentIdx / (effectiveSteps.length - 1)) * 100);

  return (
    <div className="w-full" aria-label={`Step ${currentIdx + 1} of ${effectiveSteps.length}`}>
      {/* Step labels - desktop */}
      <div className="hidden md:flex items-center justify-between mb-3">
        {effectiveSteps.map((stepNum, idx) => {
          const isCompleted = completedSteps.includes(stepNum);
          const isCurrent = stepNum === currentStep;
          const label = STEP_LABELS[stepNum - 1];

          return (
            <div
              key={stepNum}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                  transition-all duration-300 border-2
                  ${isCompleted
                    ? 'bg-accent border-accent text-white'
                    : isCurrent
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                  }
                `}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-xs font-medium text-center leading-tight max-w-[64px] ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-accent' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div
        className="w-full bg-gray-200 rounded-full h-2"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${progressPercent}% complete`}
      >
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Mobile step info */}
      <div className="flex md:hidden items-center justify-between mt-2">
        <span className="text-xs text-gray-500">
          Step {currentIdx + 1} of {effectiveSteps.length}
        </span>
        <span className="text-xs font-medium text-primary">
          {STEP_LABELS[currentStep - 1]}
        </span>
        <span className="text-xs text-gray-500">{progressPercent}%</span>
      </div>
    </div>
  );
}
