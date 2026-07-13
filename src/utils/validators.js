// ============================================================
// PAN Validation
// Format: AAAAA9999A (5 letters + 4 digits + 1 letter)
// 4th character = entity type
// ============================================================

export const VALID_PAN_ENTITY_TYPES = {
  P: 'Individual',
  C: 'Company',
  H: 'HUF (Hindu Undivided Family)',
  A: 'AOP (Association of Persons)',
  B: 'BOI (Body of Individuals)',
  G: 'Government',
  J: 'Artificial Juridical Person',
  L: 'Local Authority',
  F: 'Firm',
  T: 'Trust',
};

export function validatePAN(pan, allowedEntityTypes = ['P']) {
  if (!pan) return { valid: false, error: 'PAN number is required' };

  const trimmed = pan.trim().toUpperCase();

  // Basic format check: 5 letters + 4 digits + 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'PAN must be in format AAAAA9999A (5 letters, 4 digits, 1 letter)',
    };
  }

  // 4th character entity type check
  const entityChar = trimmed[3];
  if (!VALID_PAN_ENTITY_TYPES[entityChar]) {
    return {
      valid: false,
      error: `PAN 4th character '${entityChar}' is not a valid entity type`,
    };
  }

  if (!allowedEntityTypes.includes(entityChar)) {
    const allowed = allowedEntityTypes.map((e) => `${e} (${VALID_PAN_ENTITY_TYPES[e]})`).join(', ');
    return {
      valid: false,
      error: `This loan type requires entity type: ${allowed}`,
    };
  }

  return { valid: true, entityType: VALID_PAN_ENTITY_TYPES[entityChar] };
}

// ============================================================
// Aadhaar Verhoeff Checksum Validation
// ============================================================

const VERHOEFF_MULT = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_PERM = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export function verhoeffChecksum(num) {
  const digits = num.split('').reverse().map(Number);
  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_MULT[c][VERHOEFF_PERM[i % 8][digits[i]]];
  }
  return c === 0;
}

export function validateAadhaar(aadhaar) {
  if (!aadhaar) return { valid: false, error: 'Aadhaar number is required' };

  const digits = aadhaar.replace(/\s/g, '');

  if (!/^\d{12}$/.test(digits)) {
    return { valid: false, error: 'Aadhaar must be exactly 12 digits' };
  }

  // First digit cannot be 0 or 1
  if (digits[0] === '0' || digits[0] === '1') {
    return { valid: false, error: 'Aadhaar number is invalid (cannot start with 0 or 1)' };
  }

  if (!verhoeffChecksum(digits)) {
    return { valid: false, error: 'Aadhaar number is invalid (checksum failed)' };
  }

  return { valid: true };
}

// ============================================================
// GST Number Validation
// Format: 2-digit state code + 10-char PAN + 1 entity + 'Z' + checksum
// ============================================================

export function validateGST(gst) {
  if (!gst) return { valid: false, error: 'GST number is required' };

  const trimmed = gst.trim().toUpperCase();

  if (trimmed.length !== 15) {
    return { valid: false, error: 'GST number must be exactly 15 characters' };
  }

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid GST format. Expected: 2-digit state code + PAN + entity + Z + checksum',
    };
  }

  const stateCode = parseInt(trimmed.substring(0, 2), 10);
  if (stateCode < 1 || stateCode > 38) {
    return { valid: false, error: 'Invalid state code in GST number' };
  }

  return { valid: true };
}

// ============================================================
// Mobile Number Validation (India)
// ============================================================
export function validateMobile(mobile) {
  if (!mobile) return { valid: false, error: 'Mobile number is required' };
  const digits = mobile.replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      valid: false,
      error: 'Mobile number must be 10 digits starting with 6, 7, 8, or 9',
    };
  }
  return { valid: true };
}

// ============================================================
// PIN Code Validation
// ============================================================
export function validatePinCode(pin) {
  if (!pin) return { valid: false, error: 'PIN code is required' };
  if (!/^\d{6}$/.test(pin)) {
    return { valid: false, error: 'PIN code must be exactly 6 digits' };
  }
  return { valid: true };
}

// ============================================================
// Age Validation
// ============================================================
export function calculateAge(dob) {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function validateAge(dob, minAge = 21, maxAge = 65) {
  if (!dob) return { valid: false, error: 'Date of birth is required' };
  const age = calculateAge(dob);
  if (age < minAge) {
    return { valid: false, error: `Applicant must be at least ${minAge} years old` };
  }
  if (age > maxAge) {
    return { valid: false, error: `Applicant must not be older than ${maxAge} years` };
  }
  return { valid: true, age };
}
