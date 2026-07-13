import { useEffect, useRef, useCallback } from 'react';
import { encrypt } from '../utils/encryption';
import { DRAFT_KEY_PREFIX, DRAFT_TTL_HOURS } from '../utils/constants';
import toast from 'react-hot-toast';

/**
 * Auto-save hook: saves form state to LocalStorage every `interval` ms
 * Data is AES-256-GCM encrypted before storage
 */
export function useAutoSave(formData, currentStep, interval = 30000) {
  const timerRef = useRef(null);
  const isSavingRef = useRef(false);

  const saveToStorage = useCallback(async (data, step) => {
    if (isSavingRef.current) return;

    const loanType = data?.step1?.loanType;
    if (!loanType) return; // Don't save if no loan type selected yet

    isSavingRef.current = true;

    try {
      const metadata = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        step,
        loanType,
      };

      const payload = JSON.stringify({ formData: data, metadata });
      const encrypted = await encrypt(payload);

      if (encrypted) {
        const key = `${DRAFT_KEY_PREFIX}${loanType}`;
        localStorage.setItem(key, encrypted);
        localStorage.setItem(`${key}_meta`, JSON.stringify(metadata));

        const timeStr = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        });

        toast.success(`Draft saved at ${timeStr}`, {
          id: 'auto-save',
          duration: 2000,
          position: 'bottom-right',
          style: {
            fontSize: '13px',
            padding: '8px 12px',
          },
        });
      }
    } catch (err) {
      // Silent fail - auto-save should never crash the app
      console.error('Auto-save failed:', err);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Reset timer on every state change
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      saveToStorage(formData, currentStep);
    }, interval);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [formData, currentStep, interval, saveToStorage]);

  // Manual save trigger
  const saveNow = useCallback(() => {
    saveToStorage(formData, currentStep);
  }, [formData, currentStep, saveToStorage]);

  return { saveNow };
}

/**
 * Check for saved drafts in LocalStorage
 * @returns {Array} List of found drafts with metadata
 */
export function findSavedDrafts() {
  const drafts = [];
  const loanTypes = ['personal', 'home', 'business'];

  for (const type of loanTypes) {
    const key = `${DRAFT_KEY_PREFIX}${type}`;
    const metaKey = `${key}_meta`;
    const encrypted = localStorage.getItem(key);
    const metaStr = localStorage.getItem(metaKey);

    if (encrypted && metaStr) {
      try {
        const meta = JSON.parse(metaStr);
        const savedTime = new Date(meta.timestamp);
        const now = new Date();
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

        if (hoursDiff <= DRAFT_TTL_HOURS) {
          drafts.push({ key, type, meta, encrypted, hoursDiff: Math.round(hoursDiff * 10) / 10 });
        } else {
          // Expired draft - clean up silently
          localStorage.removeItem(key);
          localStorage.removeItem(metaKey);
        }
      } catch {
        // Corrupted metadata - clean up
        localStorage.removeItem(key);
        localStorage.removeItem(metaKey);
      }
    }
  }

  return drafts;
}

/**
 * Clear a saved draft
 */
export function clearDraft(loanType) {
  const key = `${DRAFT_KEY_PREFIX}${loanType}`;
  localStorage.removeItem(key);
  localStorage.removeItem(`${key}_meta`);
}
