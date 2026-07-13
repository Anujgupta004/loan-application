import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormStore } from '../../store/formStore';
import { validateGST } from '../../utils/validators';
import Input, { InputField } from '../common/Input';
import Select from '../common/Select';
import RadioGroup from '../common/RadioGroup';
import CurrencyInput from '../common/CurrencyInput';
import StepNavigation from '../wizard/StepNavigation';
import { BUSINESS_TYPES, STATES_LIST } from '../../utils/constants';

const EMPLOYMENT_OPTIONS = [
  { value: 'salaried', label: '💼 Salaried' },
  { value: 'self_employed', label: '🧑‍💻 Self-Employed' },
  { value: 'business_owner', label: '🏭 Business Owner' },
];

function createStep5Schema(loanType) {
  return z.discriminatedUnion('employmentType', [
    // SALARIED
    z.object({
      employmentType: z.literal('salaried'),
      companyName: z.string().min(2, 'Company name is required').max(100),
      designation: z.string().min(2, 'Designation is required').max(100),
      monthlyNetSalary: z
        .string()
        .min(1, 'Monthly salary is required')
        .refine((v) => Number(v.replace(/,/g, '')) >= 15000, 'Minimum salary is ₹15,000'),
      yearsOfExperience: z
        .string()
        .min(1, 'Years of experience is required')
        .refine((v) => Number(v) >= 0 && Number(v) <= 50, 'Must be 0–50 years'),
      officeAddressLine1: z.string().optional(),
      officeCity: z.string().optional(),
    }),
    // SELF EMPLOYED
    z.object({
      employmentType: z.literal('self_employed'),
      businessName: z.string().min(2, 'Business name is required').max(100),
      businessType: z.string().min(1, 'Business type is required'),
      annualTurnover: z
        .string()
        .min(1, 'Annual turnover is required')
        .refine((v) => Number(v.replace(/,/g, '')) >= 300000, 'Minimum annual turnover is ₹3,00,000'),
      yearsInBusiness: z
        .string()
        .min(1, 'Years in business is required')
        .refine((v) => Number(v) >= 2, 'Minimum 2 years in business required'),
      monthlyIncome: z
        .string()
        .min(1, 'Monthly income is required'),
      yearsOfExperience: z
        .string()
        .min(1, 'Years of experience is required')
        .refine((v) => Number(v) >= 0 && Number(v) <= 50, 'Must be 0–50 years'),
      businessAddressLine1: z.string().min(5, 'Business address is required'),
      businessCity: z.string().min(1, 'City is required'),
      businessState: z.string().min(1, 'State is required'),
    }),
    // BUSINESS OWNER
    z.object({
      employmentType: z.literal('business_owner'),
      businessName: z.string().min(2, 'Business name is required').max(100),
      businessType: z.string().min(1, 'Business type is required'),
      annualTurnover: z
        .string()
        .min(1, 'Annual turnover is required')
        .refine((v) => Number(v.replace(/,/g, '')) >= 300000, 'Minimum annual turnover is ₹3,00,000'),
      yearsInBusiness: z
        .string()
        .min(1, 'Years in business is required')
        .refine((v) => Number(v) >= 2, 'Minimum 2 years in business required'),
      monthlyIncome: z
        .string()
        .min(1, 'Monthly income is required'),
      gstNumber: z
        .string()
        .superRefine((val, ctx) => {
          if (!val || val.length < 15) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'GST number must be 15 characters' });
            return;
          }
          const result = validateGST(val);
          if (!result.valid) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error });
          }
        }),
      yearsOfExperience: z
        .string()
        .min(1, 'Years of experience is required')
        .refine((v) => Number(v) >= 0 && Number(v) <= 50, 'Must be 0–50 years'),
      businessAddressLine1: z.string().min(5, 'Business address is required'),
      businessCity: z.string().min(1, 'City is required'),
      businessState: z.string().min(1, 'State is required'),
    }),
  ]).superRefine((data, ctx) => {
    // Business loan requires non-salaried
    if (loanType === 'business' && data.employmentType === 'salaried') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['employmentType'],
        message: 'Business loans require Self-Employed or Business Owner employment type',
      });
    }
  });
}

export default function Step5Employment({ onNext, onPrev }) {
  const { formData, updateStepData, completeStep } = useFormStore();
  const saved = formData.step5;
  const loanType = formData.step1?.loanType || 'personal';

  const schema = createStep5Schema(loanType);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      employmentType: saved.employmentType || (loanType === 'business' ? 'business_owner' : 'salaried'),
      companyName: saved.companyName || '',
      designation: saved.designation || '',
      monthlyNetSalary: saved.monthlyNetSalary || '',
      yearsOfExperience: saved.yearsOfExperience || '',
      businessName: saved.businessName || '',
      businessType: saved.businessType || '',
      annualTurnover: saved.annualTurnover || '',
      yearsInBusiness: saved.yearsInBusiness || '',
      monthlyIncome: saved.monthlyIncome || '',
      gstNumber: saved.gstNumber || '',
      businessAddressLine1: saved.businessAddressLine1 || '',
      businessCity: saved.businessCity || '',
      businessState: saved.businessState || '',
      officeAddressLine1: saved.officeAddressLine1 || '',
      officeCity: saved.officeCity || '',
    },
    mode: 'onBlur',
  });

  const employmentType = watch('employmentType');

  // Clear irrelevant fields when switching employment type
  useEffect(() => {
    if (employmentType === 'salaried') {
      setValue('businessName', '');
      setValue('gstNumber', '');
      setValue('annualTurnover', '');
      setValue('monthlyIncome', '');
    } else {
      setValue('companyName', '');
      setValue('designation', '');
      setValue('monthlyNetSalary', '');
    }
  }, [employmentType, setValue]);

  const onSubmit = (data) => {
    updateStepData(5, data);
    completeStep(5);
    onNext();
  };

  const isSalaried = employmentType === 'salaried';
  const isNotSalaried = employmentType === 'self_employed' || employmentType === 'business_owner';
  const isBusinessOwner = employmentType === 'business_owner';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Employment & Income</h2>
          <p className="text-sm text-gray-500">Your income details are used to calculate loan eligibility.</p>
        </div>

        {/* Employment Type */}
        <Controller
          name="employmentType"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Employment Type"
              required
              name="employmentType"
              options={loanType === 'business'
                ? EMPLOYMENT_OPTIONS.filter((o) => o.value !== 'salaried')
                : EMPLOYMENT_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.employmentType?.message}
            />
          )}
        />

        {/* SALARIED FIELDS */}
        {isSalaried && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 animate-slide-in">
            <h3 className="text-sm font-semibold text-gray-700">Salaried Employee Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Company Name" id="companyName" required error={errors.companyName?.message}>
                <InputField id="companyName" placeholder="ABC Technologies Pvt. Ltd." error={errors.companyName?.message} {...register('companyName')} />
              </Input>
              <Input label="Designation" id="designation" required error={errors.designation?.message}>
                <InputField id="designation" placeholder="Software Engineer" error={errors.designation?.message} {...register('designation')} />
              </Input>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller name="monthlyNetSalary" control={control} render={({ field }) => (
                <CurrencyInput id="monthlyNetSalary" label="Monthly Net Salary" required value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} error={errors.monthlyNetSalary?.message} helpText="Minimum ₹15,000/month" placeholder="50000" />
              )} />
              <Input label="Years of Experience" id="yearsOfExperience" required error={errors.yearsOfExperience?.message}>
                <InputField id="yearsOfExperience" type="number" placeholder="5" min={0} max={50} inputMode="numeric" error={errors.yearsOfExperience?.message} {...register('yearsOfExperience')} />
              </Input>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Office Address" id="officeAddressLine1" error={errors.officeAddressLine1?.message}>
                <InputField id="officeAddressLine1" placeholder="Office address (optional)" error={errors.officeAddressLine1?.message} {...register('officeAddressLine1')} />
              </Input>
              <Input label="Office City" id="officeCity" error={errors.officeCity?.message}>
                <InputField id="officeCity" placeholder="City" error={errors.officeCity?.message} {...register('officeCity')} />
              </Input>
            </div>
          </div>
        )}

        {/* SELF-EMPLOYED / BUSINESS OWNER FIELDS */}
        {isNotSalaried && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 animate-slide-in">
            <h3 className="text-sm font-semibold text-gray-700">
              {isBusinessOwner ? 'Business Owner Details' : 'Self-Employment Details'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Business Name" id="businessName" required error={errors.businessName?.message}>
                <InputField id="businessName" placeholder="Your Business Name" error={errors.businessName?.message} {...register('businessName')} />
              </Input>
              <Select id="businessType" label="Business Type" required placeholder="Select type" options={BUSINESS_TYPES.map((b) => ({ value: b, label: b }))} error={errors.businessType?.message} {...register('businessType')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller name="annualTurnover" control={control} render={({ field }) => (
                <CurrencyInput id="annualTurnover" label="Annual Turnover" required value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} error={errors.annualTurnover?.message} helpText="Minimum ₹3,00,000 per year" placeholder="1200000" />
              )} />
              <Controller name="monthlyIncome" control={control} render={({ field }) => (
                <CurrencyInput id="monthlyIncome" label="Monthly Income (Net)" required value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} error={errors.monthlyIncome?.message} placeholder="50000" />
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Years in Business" id="yearsInBusiness" required error={errors.yearsInBusiness?.message} helpText="Minimum 2 years required">
                <InputField id="yearsInBusiness" type="number" placeholder="5" min={2} max={50} inputMode="numeric" error={errors.yearsInBusiness?.message} {...register('yearsInBusiness')} />
              </Input>
              <Input label="Years of Experience" id="yearsOfExperience" required error={errors.yearsOfExperience?.message}>
                <InputField id="yearsOfExperience" type="number" placeholder="8" min={0} max={50} inputMode="numeric" error={errors.yearsOfExperience?.message} {...register('yearsOfExperience')} />
              </Input>
            </div>
            {isBusinessOwner && (
              <Input label="GST Number" id="gstNumber" required error={errors.gstNumber?.message} helpText="15-character GST identification number">
                <InputField id="gstNumber" placeholder="27ABCDE1234F1Z5" maxLength={15} className="uppercase" error={errors.gstNumber?.message} {...register('gstNumber', { onChange: (e) => { e.target.value = e.target.value.toUpperCase(); } })} />
              </Input>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Business Address" id="businessAddressLine1" required error={errors.businessAddressLine1?.message}>
                <InputField id="businessAddressLine1" placeholder="Business address" error={errors.businessAddressLine1?.message} {...register('businessAddressLine1')} />
              </Input>
              <Input label="Business City" id="businessCity" required error={errors.businessCity?.message}>
                <InputField id="businessCity" placeholder="City" error={errors.businessCity?.message} {...register('businessCity')} />
              </Input>
            </div>
            <Select id="businessState" label="Business State" required placeholder="Select state" options={STATES_LIST.map((s) => ({ value: s, label: s }))} error={errors.businessState?.message} {...register('businessState')} />
          </div>
        )}
      </div>

      <StepNavigation onNext={handleSubmit(onSubmit)} onPrev={onPrev} />
    </form>
  );
}
