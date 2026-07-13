import { useState, useCallback } from 'react';
import { lookupPinCode } from '../data/pinCodes';

/**
 * Hook for PIN code auto-fill simulation
 */
export function usePinCodeLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const lookup = useCallback((pin) => {
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setResult(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    // Simulate API delay
    setTimeout(() => {
      const data = lookupPinCode(pin);
      setIsLoading(false);

      if (data) {
        setResult(data);
        setError(null);
      } else {
        setResult(null);
        setError('PIN code not found. Please enter city and state manually.');
      }
    }, 600);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { isLoading, result, error, lookup, reset };
}
