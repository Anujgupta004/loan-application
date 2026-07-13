/**
 * useFormPersistence
 *
 * Higher-level hook that combines auto-save + draft discovery.
 * Checks localStorage on mount for saved drafts and exposes
 * restore / discard helpers.
 *
 * The actual encryption/decryption is delegated to useAutoSave
 * (encrypt on write) and encryption.js decrypt() (on read).
 */

import { useState, useEffect, useCallback } from 'react';
import { findSavedDrafts, clearDraft } from './useAutoSave';
import { decrypt } from '../utils/encryption';

/**
 * @returns {{
 *   hasDraft: boolean,
 *   draft: object|null,
 *   restoreDraft: () => Promise<object|null>,
 *   discardDraft: () => void,
 * }}
 */
export function useFormPersistence() {
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    const found = findSavedDrafts();
    if (found.length > 0) {
      setDraft(found[0]);
    }
  }, []);

  /**
   * Decrypt and return the saved form state.
   * Returns null on failure (corruption / crypto context change).
   */
  const restoreDraft = useCallback(async () => {
    if (!draft) return null;
    try {
      const decrypted = await decrypt(draft.encrypted);
      if (!decrypted) {
        clearDraft(draft.type);
        setDraft(null);
        return null;
      }
      const parsed = JSON.parse(decrypted);
      clearDraft(draft.type);
      setDraft(null);
      return parsed;
    } catch {
      clearDraft(draft.type);
      setDraft(null);
      return null;
    }
  }, [draft]);

  /**
   * Discard the saved draft and reset local state.
   */
  const discardDraft = useCallback(() => {
    if (draft) {
      clearDraft(draft.type);
    }
    setDraft(null);
  }, [draft]);

  return {
    hasDraft: draft !== null,
    draft,
    restoreDraft,
    discardDraft,
  };
}
