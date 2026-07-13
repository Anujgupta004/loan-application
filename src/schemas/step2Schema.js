import { z } from 'zod';
import { calculateAge } from '../utils/validators';

export const step2Schema = z
  .object({
    fullName: z
      .string({ required_error: 'Full name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces, and periods'),
    dateOfBirth: z
      .string({ required_error: 'Date of birth is required' })
      .min(1, 'Date of birth is required'),
    gender: z.enum(['male', 'female', 'other'], {
      required_error: 'Please select your gender',
    }),
    maritalStatus: z
      .string({ required_error: 'Marital status is required' })
      .min(1, 'Please select marital status'),
    fatherName: z
      .string({ required_error: "Father's name is required" })
      .min(2, "Father's name must be at least 2 characters")
      .max(100, "Father's name must not exceed 100 characters")
      .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces, and periods'),
    motherName: z
      .string({ required_error: "Mother's name is required" })
      .min(2, "Mother's name must be at least 2 characters")
      .max(100, "Mother's name must not exceed 100 characters")
      .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces, and periods'),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address'),
    mobile: z
      .string({ required_error: 'Mobile number is required' })
      .regex(/^[6-9]\d{9}$/, 'Mobile number must be 10 digits starting with 6, 7, 8, or 9'),
    alternateMobile: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[6-9]\d{9}$/.test(val),
        'Alternate mobile must be 10 digits starting with 6, 7, 8, or 9'
      ),
  })
  .superRefine((data, ctx) => {
    // Age validation: 21–65
    if (data.dateOfBirth) {
      const age = calculateAge(data.dateOfBirth);
      if (age < 21) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dateOfBirth'],
          message: 'Applicant must be at least 21 years old',
        });
      } else if (age > 65) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dateOfBirth'],
          message: 'Applicant must not be older than 65 years',
        });
      }
    }

    // Alternate mobile must differ from primary
    if (data.alternateMobile && data.mobile && data.alternateMobile === data.mobile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['alternateMobile'],
        message: 'Alternate mobile must be different from primary mobile',
      });
    }
  });
