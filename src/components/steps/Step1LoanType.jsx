import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStore } from '../../store/formStore';
import { createStep1Schema } from '../../schemas/step1Schema';
import {
  LOAN_TYPE_LABELS, LOAN_LIMITS, TENURE_RANGES, LOAN_PURPOSES,
} from '../../utils/constants';
import { formatIndianNumber } from '../../utils/emiCalculator';
import RadioGroup from '../common/RadioGroup';
import Select from '../common/Select';
import CurrencyInput from '../common/CurrencyInput';
import Input, { InputField } from '../common/Input';
import StepNavigation from '../wizard/StepNavigation';

const LOAN_TYPE_OPTIONS = [
  { value: 'personal', label: 'Personal Loan', icon: '👤' },
  { value: 'home', label: 'Home Loan', icon: '🏠' },
  { value: 'business', label: 'Business Loan', icon: '🏢' },
];

function generateTenureOptions(min, max) {
  const options = [];
  for (let m = min; m <= max; m += (max > 120 ? 12 : 6)) {
    const years = m / 12;
    options.push({
      value: String(m),
      label: m % 12 === 0 ? `${years} Year${years > 1 ? 's' : ''} (${m} months)` : `${m} months`,
    });
  }
  return options;
}

export default function Step1LoanType({ onNext }) {
  const { formData, updateStepData, completeStep, currentStep, getNextStep } = useFormStore();
  const dob = formData.step2?.dateOfBirth;
  const savedData = formData.step1;

  const schema = createStep1Schema(dob);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      loanType: savedData.loanType || '',
      loanAmount: savedData.loanAmount || '',
      loanTenure: savedData.loanTenure || '',
      loanPurpose: savedData.loanPurpose || '',
      referralCode: savedData.referralCode || '',
    },
    mode: 'onBlur',
  });

  const watchedLoanType = watch('loanType');
  const limits = watchedLoanType ? LOAN_LIMITS[watchedLoanType] : null;
  const tenureRange = watchedLoanType ? TENURE_RANGES[watchedLoanType] : null;
  const purposes = watchedLoanType ? LOAN_PURPOSES[watchedLoanType] : [];

  // Reset amount/tenure/purpose when loan type changes
  useEffect(() => {
    if (watchedLoanType && watchedLoanType !== savedData.loanType) {
      setValue('loanAmount', '');
      setValue('loanTenure', '');
      setValue('loanPurpose', '');
    }
  }, [watchedLoanType, savedData.loanType, setValue]);

  const onSubmit = (data) => {
    updateStepData(1, data);
    completeStep(1);
    onNext();
  };

  const tenureOptions = tenureRange ? generateTenureOptions(tenureRange.min, tenureRange.max) : [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Loan Type & Amount</h2>
          <p className="text-sm text-gray-500">Select your loan type and enter the amount you need.</p>
        </div>

        {/* Loan Type */}
        <Controller
          name="loanType"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Select Loan Type"
              required
              name="loanType"
              options={LOAN_TYPE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.loanType?.message}
              layout="horizontal"
            />
          )}
        />

        {watchedLoanType && (
          <div className="animate-fade-in space-y-5">
            {/* Loan Amount */}
            <Controller
              name="loanAmount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="loanAmount"
                  label="Loan Amount"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  error={errors.loanAmount?.message}
                  helpText={limits ? `Range: ${limits.label}` : ''}
                  placeholder="Enter loan amount"
                />
              )}
            />

            {/* Loan Tenure */}
            <Select
              id="loanTenure"
              label="Loan Tenure"
              required
              placeholder="Select tenure"
              options={tenureOptions}
              error={errors.loanTenure?.message}
              helpText={tenureRange ? `${tenureRange.min}–${tenureRange.max} months` : ''}
              {...register('loanTenure')}
            />

            {/* Loan Purpose */}
            <Select
              id="loanPurpose"
              label="Loan Purpose"
              required
              placeholder="Select purpose"
              options={purposes.map((p) => ({ value: p, label: p }))}
              error={errors.loanPurpose?.message}
              {...register('loanPurpose')}
            />

            {/* Referral Code */}
            <Input label="Referral Code" id="referralCode" helpText="Optional – 6 to 10 alphanumeric characters" error={errors.referralCode?.message}>
              <InputField
                id="referralCode"
                placeholder="e.g. LEND2024"
                error={errors.referralCode?.message}
                {...register('referralCode')}
              />
            </Input>

        {/* Info card */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4" role="note" aria-label={`${LOAN_TYPE_LABELS[watchedLoanType]} summary`}>
          <h3 className="text-sm font-semibold text-primary mb-2">
            {LOAN_TYPE_LABELS[watchedLoanType]} – Quick Overview
          </h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Amount Range: {limits?.label}</li>
            <li>• Tenure: {tenureRange?.min}–{tenureRange?.max} months</li>
            <li>• Interest Rate: {watchedLoanType === 'personal' ? '10.5%' : watchedLoanType === 'home' ? '8.5%' : '14%'} p.a. (Fixed)</li>
            <li>• Processing Fee: 1% of loan amount (min ₹2,000 · max ₹25,000)</li>
          </ul>
        </div>
          </div>
        )}
      </div>

      <StepNavigation onNext={handleSubmit(onSubmit)} isLastStep={false} />
    </form>
  );
}
