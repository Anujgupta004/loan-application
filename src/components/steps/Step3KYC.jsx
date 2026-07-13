import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormStore } from '../../store/formStore';
import { useVerification } from '../../hooks/useVerification';
import { validatePAN, validateAadhaar } from '../../utils/validators';
import Input, { InputField } from '../common/Input';
import Checkbox from '../common/Checkbox';
import { VerifiedBadge } from '../common/VerifiedBadge';
import StepNavigation from '../wizard/StepNavigation';

const VOTER_ID_REGEX = /^[A-Z]{3}[0-9]{7}$/;
const PASSPORT_REGEX = /^[A-Z][0-9]{7}$/;

function createStep3Schema(loanType) {
  const allowedPAN = loanType === 'business' ? ['P', 'C', 'F'] : ['P'];
  return z.object({
    panNumber: z
      .string({ required_error: 'PAN number is required' })
      .superRefine((val, ctx) => {
        const result = validatePAN(val, allowedPAN);
        if (!result.valid) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error });
        }
      }),
    aadhaarNumber: z
      .string({ required_error: 'Aadhaar number is required' })
      .superRefine((val, ctx) => {
        const result = validateAadhaar(val.replace(/\s/g, ''));
        if (!result.valid) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error });
        }
      }),
    aadhaarConsent: z
      .boolean({ required_error: 'Aadhaar consent is required' })
      .refine((v) => v === true, 'You must consent to Aadhaar verification to proceed'),
    voterId: z
      .string()
      .optional()
      .refine(
        (val) => !val || VOTER_ID_REGEX.test(val.toUpperCase()),
        'Voter ID format: 3 letters + 7 digits (e.g., ABC1234567)'
      ),
    passportNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || PASSPORT_REGEX.test(val.toUpperCase()),
        'Passport format: 1 letter + 7 digits (e.g., A1234567)'
      ),
  });
}

// Masked display: show only last 4 chars
function maskValue(val, char = '*') {
  if (!val || val.length <= 4) return val;
  return char.repeat(val.length - 4) + val.slice(-4);
}

export default function Step3KYC({ onNext, onPrev }) {
  const { formData, updateStepData, completeStep } = useFormStore();
  const saved = formData.step3;
  const loanType = formData.step1?.loanType || 'personal';

  const [showPAN, setShowPAN] = useState(false);
  const [showAadhaar, setShowAadhaar] = useState(false);

  const panVerification = useVerification('PAN', loanType === 'business' ? ['P', 'C', 'F'] : ['P']);
  const aadhaarVerification = useVerification('AADHAAR');

  const schema = createStep3Schema(loanType);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      panNumber: saved.panNumber || '',
      aadhaarNumber: saved.aadhaarNumber || '',
      aadhaarConsent: saved.aadhaarConsent || false,
      voterId: saved.voterId || '',
      passportNumber: saved.passportNumber || '',
    },
    mode: 'onBlur',
  });

  const onSubmit = (data) => {
    if (!panVerification.isVerified) {
      return; // Must verify PAN
    }
    if (!aadhaarVerification.isVerified) {
      return; // Must verify Aadhaar
    }
    updateStepData(3, { ...data, panVerified: true, aadhaarVerified: true });
    completeStep(3);
    onNext();
  };

  const handlePANBlur = (e) => {
    panVerification.verify(e.target.value.toUpperCase());
  };

  const handleAadhaarBlur = (e) => {
    aadhaarVerification.verify(e.target.value.replace(/\s/g, ''));
  };

  const canProceed = panVerification.isVerified && aadhaarVerification.isVerified;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Identity Verification (KYC)</h2>
          <p className="text-sm text-gray-500">Your documents are verified securely. PAN and Aadhaar are mandatory.</p>
        </div>

        {/* PAN Number */}
        <div className="space-y-1">
          <Input label="PAN Number" id="panNumber" required error={errors.panNumber?.message}
            helpText="Format: AAAAA9999A (e.g., ABCPE1234F)">
            <div className="relative">
              <InputField
                id="panNumber"
                placeholder="ABCPE1234F"
                maxLength={10}
                className="uppercase pr-10"
                error={errors.panNumber?.message}
                {...register('panNumber', {
                  onBlur: handlePANBlur,
                  onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
                })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setShowPAN(!showPAN)}
                aria-label={showPAN ? 'Hide PAN number' : 'Show PAN number'}
              >
                <span aria-hidden="true">{showPAN ? '🙈' : '👁️'}</span>
              </button>
            </div>
          </Input>
          <div aria-live="polite" aria-atomic="true" className="min-h-[20px]">
            <VerifiedBadge
              isVerifying={panVerification.isVerifying}
              isVerified={panVerification.isVerified}
              error={panVerification.verificationError}
            />
            {!panVerification.isVerified && !panVerification.isVerifying && !panVerification.verificationError && (
              <p className="text-xs text-gray-500">Enter PAN and move to next field to verify</p>
            )}
          </div>
        </div>

        {/* Aadhaar Number */}
        <div className="space-y-1">
          <Input label="Aadhaar Number" id="aadhaarNumber" required error={errors.aadhaarNumber?.message}
            helpText="12-digit unique identification number">
            <InputField
              id="aadhaarNumber"
              placeholder="XXXX XXXX XXXX"
              maxLength={14}
              error={errors.aadhaarNumber?.message}
              {...register('aadhaarNumber', {
                onBlur: handleAadhaarBlur,
              })}
            />
          </Input>
          <div aria-live="polite" aria-atomic="true" className="min-h-[20px]">
            <VerifiedBadge
              isVerifying={aadhaarVerification.isVerifying}
              isVerified={aadhaarVerification.isVerified}
              error={aadhaarVerification.verificationError}
            />
            {!aadhaarVerification.isVerified && !aadhaarVerification.isVerifying && !aadhaarVerification.verificationError && (
              <p className="text-xs text-gray-500">Enter Aadhaar number and move to next field to verify</p>
            )}
          </div>
        </div>

        {/* Aadhaar Consent */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <Checkbox
            id="aadhaarConsent"
            required
            error={errors.aadhaarConsent?.message}
            label="I hereby voluntarily consent to the use of my Aadhaar number for KYC verification purposes as per the Aadhaar Act, 2016. I understand that my biometric data will not be stored and this is a one-time verification."
            {...register('aadhaarConsent')}
          />
        </div>

        {/* Optional Documents */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Optional Identity Documents</h3>
          <Input label="Voter ID" id="voterId" error={errors.voterId?.message}
            helpText="Format: 3 letters + 7 digits (e.g., ABC1234567)">
            <InputField
              id="voterId"
              placeholder="ABC1234567"
              maxLength={10}
              className="uppercase"
              error={errors.voterId?.message}
              {...register('voterId', {
                onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
              })}
            />
          </Input>

          {(loanType === 'home') && (
            <Input label="Passport Number" id="passportNumber" error={errors.passportNumber?.message}
              helpText="Format: 1 letter + 7 digits (e.g., A1234567)">
              <InputField
                id="passportNumber"
                placeholder="A1234567"
                maxLength={8}
                className="uppercase"
                error={errors.passportNumber?.message}
                {...register('passportNumber', {
                  onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
                })}
              />
            </Input>
          )}
        </div>

        {/* Must verify warning */}
        {!canProceed && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <span className="text-amber-500 text-lg">⚠️</span>
            <p className="text-sm text-amber-700">
              Both PAN and Aadhaar must be verified before proceeding.
            </p>
          </div>
        )}
      </div>

      <StepNavigation onNext={handleSubmit(onSubmit)} onPrev={onPrev} canProceed={canProceed} />
    </form>
  );
}
