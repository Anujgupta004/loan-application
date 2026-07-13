import { useState, useEffect, useRef, useCallback } from 'react';
import { useFormStore } from '../../store/formStore';
import { findSavedDrafts, clearDraft } from '../../hooks/useAutoSave';
import { decrypt } from '../../utils/encryption';
import { LOAN_TYPE_LABELS } from '../../utils/constants';
import Button from '../common/Button';

export default function ResumeModal() {
  const [drafts, setDrafts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const { restoreState } = useFormStore();
  const modalRef = useRef(null);
  const firstFocusRef = useRef(null);

  useEffect(() => {
    const found = findSavedDrafts();
    if (found.length > 0) {
      setDrafts(found);
      setSelectedDraft(found[0]);
      setIsOpen(true);
    }
  }, []);

  // Focus trap: keep Tab/Shift+Tab inside modal
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      handleStartFresh();
      return;
    }
    if (e.key !== 'Tab') return;

    const modal = modalRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Move focus into modal
      setTimeout(() => { firstFocusRef.current?.focus(); }, 50);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const handleResume = async () => {
    if (!selectedDraft) return;
    setIsLoading(true);

    try {
      const decrypted = await decrypt(selectedDraft.encrypted);
      if (decrypted) {
        const parsed = JSON.parse(decrypted);
        restoreState({
          formData: parsed.formData,
          currentStep: parsed.metadata.step || 1,
          completedSteps: Object.keys(parsed.formData)
            .filter((k) => k.startsWith('step') && Object.keys(parsed.formData[k]).length > 0)
            .map((k) => Number(k.replace('step', '')))
            .filter((n) => n < (parsed.metadata.step || 1)),
        });
        setIsOpen(false);
      } else {
        // Decryption failed – start fresh
        clearDraft(selectedDraft.type);
        setIsOpen(false);
      }
    } catch {
      clearDraft(selectedDraft.type);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartFresh = () => {
    drafts.forEach((d) => clearDraft(d.type));
    setIsOpen(false);
  };

  if (!isOpen || !selectedDraft) return null;

  const savedTime = new Date(selectedDraft.meta.timestamp).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </div>
          <div>
            <h2 id="resume-modal-title" className="text-base font-semibold text-gray-900">Resume Application?</h2>
            <p className="text-xs text-gray-500">We found a saved application</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {LOAN_TYPE_LABELS[selectedDraft.type] || selectedDraft.type}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Step {selectedDraft.meta.step} • Saved {savedTime}
              </p>
            </div>
            <span className="text-2xl" aria-hidden="true">
              {selectedDraft.type === 'personal' ? '👤' : selectedDraft.type === 'home' ? '🏠' : '🏢'}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          Would you like to continue from where you left off, or start a new application?
        </p>

        <div className="flex gap-3">
          <Button
            ref={firstFocusRef}
            variant="secondary"
            onClick={handleStartFresh}
            className="flex-1"
          >
            Start Fresh
          </Button>
          <Button
            variant="primary"
            onClick={handleResume}
            isLoading={isLoading}
            className="flex-1"
          >
            Resume Application
          </Button>
        </div>
      </div>
    </div>
  );
}
