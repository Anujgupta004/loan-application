import { useState, useCallback, useRef } from 'react';
import { validatePAN, validateAadhaar } from '../utils/validators';

const VERIFICATION_DELAY = 1500; // 1.5 seconds simulation

/**
 * Hook for PAN/Aadhaar verification simulation
 * @param {string} type - 'PAN' or 'AADHAAR'
 * @param {string[]} allowedEntityTypes - For PAN: which entity types are valid
 */
export function useVerification(type, allowedEntityTypes = ['P']) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [verifiedValue, setVerifiedValue] = useState(null);
  const timerRef = useRef(null);

  const verify = useCallback(
    (value) => {
      if (!value || value === verifiedValue) return;

      // Cancel previous timer
      if (timerRef.current) clearTimeout(timerRef.current);

      // Reset state
      setIsVerified(false);
      setVerificationError(null);

      // Format check first (immediate)
      let formatResult;
      if (type === 'PAN') {
        formatResult = validatePAN(value, allowedEntityTypes);
      } else if (type === 'AADHAAR') {
        formatResult = validateAadhaar(value);
      }

      if (!formatResult?.valid) {
        setVerificationError(formatResult?.error || 'Invalid format');
        return;
      }

      // Simulate API call delay
      setIsVerifying(true);
      timerRef.current = setTimeout(() => {
        setIsVerifying(false);
        setIsVerified(true);
        setVerifiedValue(value);
        setVerificationError(null);
      }, VERIFICATION_DELAY);
    },
    [type, allowedEntityTypes, verifiedValue]
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVerifying(false);
    setIsVerified(false);
    setVerificationError(null);
    setVerifiedValue(null);
  }, []);

  return { isVerifying, isVerified, verificationError, verify, reset };
}
