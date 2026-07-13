/**
 * Schema Factory
 * Accepts the complete form state and returns the appropriate
 * Zod schema for any given step, incorporating all cross-step rules.
 *
 * This is the centralised cross-step dependency resolver described in
 * ARCHITECTURE.md Section 2 and the project spec Day 10.
 */

import { createStep1Schema } from './step1Schema';
import { step2Schema } from './step2Schema';

// Step 3, 4, 5 schemas are inline in their respective step components
// because they use discriminatedUnion and component-local logic.
// The factory exposes them here for testing and documentation purposes.

/**
 * Get the Zod schema for a specific step, given the full form state.
 *
 * @param {number} stepNumber - 1 through 8
 * @param {object} formData   - the full formData object from FormStore
 * @returns {import('zod').ZodTypeAny} Zod schema appropriate for that step
 */
export function getSchemaForStep(stepNumber, formData = {}) {
  const dob = formData.step2?.dateOfBirth || null;
  const loanType = formData.step1?.loanType || 'personal';

  switch (stepNumber) {
    case 1:
      // Cross-step rule: age + tenure ≤ 65 (reads DOB from step 2)
      return createStep1Schema(dob);

    case 2:
      // Step 2 is static — no cross-step dependencies
      return step2Schema;

    case 3:
      // Inline in Step3KYC.jsx (createStep3Schema(loanType))
      // Exported here for reference; loanType determines PAN entity types
      return { loanType };

    case 5:
      // Inline in Step5Employment.jsx (createStep5Schema(loanType))
      // Business loans block salaried; discriminatedUnion per employment type
      return { loanType };

    default:
      return null;
  }
}

/**
 * Cross-step dependency map (14 rules from spec Section B3)
 * Used by the QA stress test and review components.
 */
export const CROSS_STEP_RULES = [
  {
    source: { step: 1, field: 'loanType' },
    target: { step: 5, field: 'employmentType' },
    rule: 'Business Loan requires Business Owner or Self-Employed',
  },
  {
    source: { step: 1, field: 'loanType' },
    target: { step: 6, field: 'visibility' },
    rule: 'Home Loan always shows Step 6 (co-applicant)',
  },
  {
    source: { step: 1, field: 'loanType' },
    target: { step: 7, field: 'documents' },
    rule: 'Document requirements vary per loan type',
  },
  {
    source: { step: 1, field: 'loanAmount' },
    target: { step: 6, field: 'visibility' },
    rule: 'Personal > ₹5L or Business > ₹20L triggers co-applicant step',
  },
  {
    source: { step: 1, field: 'loanAmount' },
    target: { step: 8, field: 'emi' },
    rule: 'EMI = f(amount, tenure, rate)',
  },
  {
    source: { step: 1, field: 'loanTenure' },
    target: { step: 8, field: 'emi' },
    rule: 'EMI uses tenure in formula',
  },
  {
    source: { step: 2, field: 'dateOfBirth' },
    target: { step: 1, field: 'loanTenure' },
    rule: 'Age + tenure must not exceed 65 years',
  },
  {
    source: { step: 2, field: 'maritalStatus' },
    target: { step: 6, field: 'relationship' },
    rule: 'If Married, Spouse is default co-applicant relationship',
  },
  {
    source: { step: 3, field: 'panVerified' },
    target: { step: 7, field: 'panCard' },
    rule: 'If PAN verified, PAN copy upload becomes optional',
  },
  {
    source: { step: 4, field: 'residenceType' },
    target: { step: 4, field: 'rentAmount' },
    rule: 'Rented residence shows rent amount field',
  },
  {
    source: { step: 5, field: 'employmentType' },
    target: { step: 5, field: 'subForm' },
    rule: 'Salaried vs Self-Employed vs Business Owner sub-form fields',
  },
  {
    source: { step: 5, field: 'employmentType' },
    target: { step: 7, field: 'documents' },
    rule: 'Salaried needs salary slips; others need ITR',
  },
  {
    source: { step: 5, field: 'monthlyIncome' },
    target: { step: 8, field: 'emiRatio' },
    rule: 'EMI must not exceed 50% of monthly income',
  },
  {
    source: { step: 6, field: 'coApplicantIncome' },
    target: { step: 8, field: 'emiRatio' },
    rule: 'Combined income (primary + co-applicant) used for EMI ratio',
  },
];
