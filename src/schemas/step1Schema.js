import { z } from 'zod';
import { LOAN_LIMITS, TENURE_RANGES, LOAN_PURPOSES } from '../utils/constants';
import { calculateAge } from '../utils/validators';

export function createStep1Schema(dob = null) {
  return z
    .object({
      loanType: z.enum(['personal', 'home', 'business'], {
        required_error: 'Please select a loan type',
      }),
      loanAmount: z
        .string({ required_error: 'Loan amount is required' })
        .min(1, 'Loan amount is required'),
      loanTenure: z
        .string({ required_error: 'Loan tenure is required' })
        .min(1, 'Please select loan tenure'),
      loanPurpose: z
        .string({ required_error: 'Loan purpose is required' })
        .min(1, 'Please select loan purpose'),
      referralCode: z
        .string()
        .optional()
        .refine(
          (val) => !val || (val.length >= 6 && val.length <= 10 && /^[A-Za-z0-9]+$/.test(val)),
          'Referral code must be 6–10 alphanumeric characters'
        ),
    })
    .superRefine((data, ctx) => {
      if (!data.loanType || !data.loanAmount) return;

      const amount = Number(data.loanAmount.replace(/[^0-9]/g, ''));
      const limits = LOAN_LIMITS[data.loanType];

      if (isNaN(amount) || amount < limits.min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['loanAmount'],
          message: `Minimum loan amount for ${data.loanType} loan is ₹${limits.min.toLocaleString('en-IN')}`,
        });
      } else if (amount > limits.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['loanAmount'],
          message: `Maximum loan amount for ${data.loanType} loan is ₹${limits.max.toLocaleString('en-IN')}`,
        });
      }

      if (data.loanTenure) {
        const tenure = Number(data.loanTenure);
        const range = TENURE_RANGES[data.loanType];

        if (tenure < range.min || tenure > range.max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['loanTenure'],
            message: `Tenure must be ${range.min}–${range.max} months for ${data.loanType} loan`,
          });
        }

        // Cross-step: age + tenure must not exceed 65 years
        if (dob) {
          const age = calculateAge(dob);
          const tenureYears = tenure / 12;
          if (age + tenureYears > 65) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['loanTenure'],
              message: `Loan tenure exceeds maximum age limit. At ${age} years, maximum tenure is ${Math.floor((65 - age) * 12)} months`,
            });
          }
        }
      }

      if (data.loanPurpose && data.loanType) {
        const validPurposes = LOAN_PURPOSES[data.loanType];
        if (!validPurposes.includes(data.loanPurpose)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['loanPurpose'],
            message: 'Please select a valid loan purpose',
          });
        }
      }
    });
}

export const step1Schema = createStep1Schema();
