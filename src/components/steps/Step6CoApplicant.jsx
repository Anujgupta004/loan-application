import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormStore } from '../../store/formStore';
import { useVerification } from '../../hooks/useVerification';
import { validatePAN } from '../../utils/validators';
import Input, { InputField } from '../common/Input';
import Select from '../common/Select';
import Checkbox from '../common/Checkbox';
import CurrencyInput from '../common/CurrencyInput';
import { VerifiedBadge } from '../common/VerifiedBadge';
import StepNavigation from '../wizard/StepNavigation';
import { LOAN_TYPE_LABELS } from '../../utils/constants';

const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'business_partner', label: 'Business Partner' },
  { value: 'other', label: 'Other' },
];

const step6Schema = z.object({
  coApplicantName: z.string().min(2, "Co-applicant's name is required").max(100),
  relationship: z.string().min(1, 'Relationship is required'),
  coApplicantPAN: z
    .string()
    .superRefine((val, ctx) => {
      const result = validatePAN(val, ['P']);
      if (!result.valid) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error });
      }
    }),
  coApplicantIncome: z.string().min(1, 'Co-applicant income is required'),
  coApplicantConsent: z
    .boolean()
    .refine((v) => v === true, 'Co-applicant consent is required to proceed'),
});

export default function Step6CoApplicant({ onNext, onPrev }) {
  const { formData, updateStepData, completeStep, isStep6Required } = useFormStore();
  const saved = formData.step6;
  const loanType = formData.step1?.loanType;
  const maritalStatus = formData.step2?.maritalStatus;

  const panVerification = useVerification('PAN', ['P']);

  // Default relationship based on marital status
  const defaultRelationship = maritalStatus === 'married' ? 'spouse' : '';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step6Schema),
    defaultValues: {
      coApplicantName: saved.coApplicantName || '',
      relationship: saved.relationship || defaultRelationship,
      coApplicantPAN: saved.coApplicantPAN || '',
      coApplicantIncome: saved.coApplicantIncome || '',
      coApplicantConsent: saved.coApplicantConsent || false,
    },
    mode: 'onBlur',
  });

  const handlePANBlur = (e) => {
    panVerification.verify(e.target.value.toUpperCase());
  };

  const onSubmit = (data) => {
    updateStepData(6, { ...data, coApplicantPANVerified: panVerification.isVerified });
    completeStep(6);
    onNext();
  };

  // Reason why step 6 is required
  const getRequirementReason = () => {
    if (loanType === 'home') return 'Co-applicant is mandatory for all Home Loans.';
    const amount = Number(formData.step1?.loanAmount?.replace(/,/g, '')) || 0;
    if (loanType === 'personal') return `Co-applicant required for Personal Loans above ₹5,00,000 (your amount: ₹${amount.toLocaleString('en-IN')}).`;
    if (loanType === 'business') return `Co-applicant required for Business Loans above ₹20,00,000 (your amount: ₹${amount.toLocaleString('en-IN')}).`;
    return '';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Co-Applicant Details</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">{getRequirementReason()}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
          {/* Name & Relationship */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Co-Applicant Full Name" id="coApplicantName" required error={errors.coApplicantName?.message}>
              <InputField id="coApplicantName" placeholder="Full name" error={errors.coApplicantName?.message} {...register('coApplicantName')} />
            </Input>
            <Select
              id="relationship"
              label="Relationship with Applicant"
              required
              placeholder="Select relationship"
              options={RELATIONSHIP_OPTIONS}
              error={errors.relationship?.message}
              {...register('relationship')}
            />
          </div>

          {/* PAN */}
          <div className="space-y-1">
            <Input label="Co-Applicant PAN Number" id="coApplicantPAN" required error={errors.coApplicantPAN?.message} helpText="Format: AAAAA9999A">
              <InputField
                id="coApplicantPAN"
                placeholder="ABCPE1234F"
                maxLength={10}
                className="uppercase"
                error={errors.coApplicantPAN?.message}
                {...register('coApplicantPAN', {
                  onBlur: handlePANBlur,
                  onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
                })}
              />
            </Input>
            <VerifiedBadge isVerifying={panVerification.isVerifying} isVerified={panVerification.isVerified} error={panVerification.verificationError} />
          </div>

          {/* Income */}
          <Controller
            name="coApplicantIncome"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id="coApplicantIncome"
                label="Co-Applicant Monthly Income"
                required
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                error={errors.coApplicantIncome?.message}
                helpText="Combined income improves loan eligibility"
                placeholder="50000"
              />
            )}
          />

          {/* Consent */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <Checkbox
              id="coApplicantConsent"
              required
              error={errors.coApplicantConsent?.message}
              label="I, the co-applicant, hereby consent to being added to this loan application. I authorize LendSwift to verify my credentials, check my credit score, and use my information for loan processing purposes as per applicable RBI guidelines."
              {...register('coApplicantConsent')}
            />
          </div>
        </div>
      </div>

      <StepNavigation onNext={handleSubmit(onSubmit)} onPrev={onPrev} />
    </form>
  );
}
