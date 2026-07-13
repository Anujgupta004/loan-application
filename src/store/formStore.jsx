import { createContext, useContext, useReducer, useCallback } from 'react';
import { CO_APPLICANT_THRESHOLDS } from '../utils/constants';

// ============================================================
// Initial State
// ============================================================
const initialState = {
  currentStep: 1,
  completedSteps: [],
  formData: {
    step1: {},
    step2: {},
    step3: {},
    step4: {},
    step5: {},
    step6: {},
    step7: { documents: {}, signature: null },
    step8: { consents: {} },
  },
  isSubmitted: false,
  applicationId: null,
  lastSaved: null,
};

// ============================================================
// Actions
// ============================================================
const ACTIONS = {
  SET_STEP: 'SET_STEP',
  UPDATE_STEP_DATA: 'UPDATE_STEP_DATA',
  COMPLETE_STEP: 'COMPLETE_STEP',
  RESTORE_STATE: 'RESTORE_STATE',
  RESET: 'RESET',
  SET_SUBMITTED: 'SET_SUBMITTED',
  SET_LAST_SAVED: 'SET_LAST_SAVED',
};

// ============================================================
// Reducer
// ============================================================
function formReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_STEP:
      return { ...state, currentStep: action.payload };

    case ACTIONS.UPDATE_STEP_DATA:
      return {
        ...state,
        formData: {
          ...state.formData,
          [`step${action.step}`]: {
            ...state.formData[`step${action.step}`],
            ...action.payload,
          },
        },
      };

    case ACTIONS.COMPLETE_STEP: {
      const completedSteps = state.completedSteps.includes(action.payload)
        ? state.completedSteps
        : [...state.completedSteps, action.payload];
      return { ...state, completedSteps };
    }

    case ACTIONS.RESTORE_STATE:
      return { ...initialState, ...action.payload };

    case ACTIONS.RESET:
      return { ...initialState };

    case ACTIONS.SET_SUBMITTED:
      return { ...state, isSubmitted: true, applicationId: action.payload };

    case ACTIONS.SET_LAST_SAVED:
      return { ...state, lastSaved: action.payload };

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================
const FormContext = createContext(null);

export function FormProvider({ children }) {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const setStep = useCallback((step) => {
    dispatch({ type: ACTIONS.SET_STEP, payload: step });
  }, []);

  const updateStepData = useCallback((step, data) => {
    dispatch({ type: ACTIONS.UPDATE_STEP_DATA, step, payload: data });
  }, []);

  const completeStep = useCallback((step) => {
    dispatch({ type: ACTIONS.COMPLETE_STEP, payload: step });
  }, []);

  const restoreState = useCallback((savedState) => {
    dispatch({ type: ACTIONS.RESTORE_STATE, payload: savedState });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: ACTIONS.RESET });
  }, []);

  const setSubmitted = useCallback((appId) => {
    dispatch({ type: ACTIONS.SET_SUBMITTED, payload: appId });
  }, []);

  const setLastSaved = useCallback((time) => {
    dispatch({ type: ACTIONS.SET_LAST_SAVED, payload: time });
  }, []);

  // ── Derived values ──────────────────────────────────────────
  const isStep6Required = useCallback(() => {
    const step1 = state.formData.step1;
    const loanType = step1?.loanType;
    const loanAmount = Number(step1?.loanAmount) || 0;

    if (!loanType) return false;
    if (loanType === 'home') return true;

    const threshold = CO_APPLICANT_THRESHOLDS[loanType];
    return loanAmount > threshold;
  }, [state.formData.step1]);

  // Effective steps (skip Step 6 if not required)
  const getEffectiveSteps = useCallback(() => {
    if (isStep6Required()) return [1, 2, 3, 4, 5, 6, 7, 8];
    return [1, 2, 3, 4, 5, 7, 8]; // skip 6
  }, [isStep6Required]);

  const getNextStep = useCallback((current) => {
    const steps = getEffectiveSteps();
    const idx = steps.indexOf(current);
    return idx < steps.length - 1 ? steps[idx + 1] : null;
  }, [getEffectiveSteps]);

  const getPrevStep = useCallback((current) => {
    const steps = getEffectiveSteps();
    const idx = steps.indexOf(current);
    return idx > 0 ? steps[idx - 1] : null;
  }, [getEffectiveSteps]);

  const getTotalSteps = useCallback(() => {
    return getEffectiveSteps().length;
  }, [getEffectiveSteps]);

  const getStepProgress = useCallback((current) => {
    const steps = getEffectiveSteps();
    const idx = steps.indexOf(current);
    return { current: idx + 1, total: steps.length };
  }, [getEffectiveSteps]);

  return (
    <FormContext.Provider
      value={{
        state,
        formData: state.formData,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        isSubmitted: state.isSubmitted,
        applicationId: state.applicationId,
        lastSaved: state.lastSaved,
        // Actions
        setStep,
        updateStepData,
        completeStep,
        restoreState,
        resetForm,
        setSubmitted,
        setLastSaved,
        // Derived
        isStep6Required,
        getEffectiveSteps,
        getNextStep,
        getPrevStep,
        getTotalSteps,
        getStepProgress,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useFormStore() {
  const context = useContext(FormContext);
  if (!context) throw new Error('useFormStore must be used within FormProvider');
  return context;
}
