import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormStore } from '../../store/formStore';
import { usePinCodeLookup } from '../../hooks/usePinCodeLookup';
import Input, { InputField } from '../common/Input';
import Select from '../common/Select';
import Checkbox from '../common/Checkbox';
import StepNavigation from '../wizard/StepNavigation';
import { RESIDENCE_TYPES, STATES_LIST } from '../../utils/constants';

const addressBlockSchema = (prefix) =>
  z.object({
    [`${prefix}Line1`]: z.string().min(5, 'Address must be at least 5 characters').max(200),
    [`${prefix}Line2`]: z.string().optional(),
    [`${prefix}PinCode`]: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits'),
    [`${prefix}City`]: z.string().min(1, 'City is required'),
    [`${prefix}State`]: z.string().min(1, 'State is required'),
  });

const step4Schema = z
  .object({
    // Current address
    currentLine1: z.string().min(5, 'Address must be at least 5 characters').max(200),
    currentLine2: z.string().optional(),
    currentPinCode: z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
    currentCity: z.string().min(1, 'City is required'),
    currentState: z.string().min(1, 'State is required'),
    residenceType: z.string().min(1, 'Please select residence type'),
    rentAmount: z.string().optional(),
    yearsAtCurrentAddress: z
      .string()
      .min(1, 'Years at current address is required')
      .refine((v) => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 50, 'Must be 0–50 years'),
    // Previous address (conditional)
    hasPreviousAddress: z.boolean().optional(),
    prevLine1: z.string().optional(),
    prevLine2: z.string().optional(),
    prevPinCode: z.string().optional(),
    prevCity: z.string().optional(),
    prevState: z.string().optional(),
    // Same as permanent
    sameAsPermanent: z.boolean().optional(),
    // Permanent address (conditional)
    permLine1: z.string().optional(),
    permLine2: z.string().optional(),
    permPinCode: z.string().optional(),
    permCity: z.string().optional(),
    permState: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.residenceType === 'rented' && !data.rentAmount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rentAmount'], message: 'Rent amount is required for rented residence' });
    }
    if (Number(data.yearsAtCurrentAddress) < 1) {
      if (!data.prevLine1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['prevLine1'], message: 'Previous address is required if you have been at current address less than 1 year' });
      }
      if (!data.prevPinCode || !/^\d{6}$/.test(data.prevPinCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['prevPinCode'], message: 'Valid PIN code required for previous address' });
      }
    }
    if (!data.sameAsPermanent) {
      if (!data.permLine1 || data.permLine1.length < 5) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['permLine1'], message: 'Permanent address is required' });
      }
      if (!data.permPinCode || !/^\d{6}$/.test(data.permPinCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['permPinCode'], message: 'Valid permanent address PIN code required' });
      }
    }
  });

function AddressBlock({ prefix, label, register, errors, setValue }) {
  const { isLoading, result, error: pinError, lookup } = usePinCodeLookup();

  const handlePinBlur = (e) => {
    const pin = e.target.value;
    lookup(pin);
  };

  useEffect(() => {
    if (result) {
      setValue(`${prefix}City`, result.city, { shouldValidate: true, shouldDirty: true });
      setValue(`${prefix}State`, result.state, { shouldValidate: true, shouldDirty: true });
    }
  }, [result, prefix, setValue]);

  return (
    <div className="space-y-4">
      {label && <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">{label}</h3>}
      <Input label="Address Line 1" id={`${prefix}Line1`} required error={errors[`${prefix}Line1`]?.message}>
        <InputField
          id={`${prefix}Line1`}
          placeholder="House/Flat No., Building Name, Street"
          autoComplete="address-line1"
          aria-required="true"
          error={errors[`${prefix}Line1`]?.message}
          {...register(`${prefix}Line1`)}
        />
      </Input>
      <Input label="Address Line 2" id={`${prefix}Line2`} error={errors[`${prefix}Line2`]?.message}>
        <InputField
          id={`${prefix}Line2`}
          placeholder="Area, Landmark (optional)"
          autoComplete="address-line2"
          error={errors[`${prefix}Line2`]?.message}
          {...register(`${prefix}Line2`)}
        />
      </Input>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="PIN Code" id={`${prefix}PinCode`} required error={errors[`${prefix}PinCode`]?.message || pinError}>
          <div className="relative">
            <InputField
              id={`${prefix}PinCode`}
              placeholder="110001"
              maxLength={6}
              inputMode="numeric"
              autoComplete="postal-code"
              aria-required="true"
              aria-busy={isLoading}
              error={errors[`${prefix}PinCode`]?.message || pinError}
              {...register(`${prefix}PinCode`, { onBlur: handlePinBlur })}
            />
            {isLoading && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className="spinner" aria-hidden="true" />
              </span>
            )}
          </div>
          {result && <p className="text-xs text-accent mt-1" aria-live="polite">✓ {result.postOffice}</p>}
        </Input>
        <Input label="City" id={`${prefix}City`} required error={errors[`${prefix}City`]?.message}>
          <InputField
            id={`${prefix}City`}
            placeholder="City"
            autoComplete="address-level2"
            aria-required="true"
            error={errors[`${prefix}City`]?.message}
            {...register(`${prefix}City`)}
          />
        </Input>
        <Select
          id={`${prefix}State`}
          label="State"
          required
          placeholder="Select state"
          options={STATES_LIST.map((s) => ({ value: s, label: s }))}
          error={errors[`${prefix}State`]?.message}
          aria-required="true"
          {...register(`${prefix}State`)}
        />
      </div>
    </div>
  );
}

export default function Step4Address({ onNext, onPrev }) {
  const { formData, updateStepData, completeStep } = useFormStore();
  const saved = formData.step4;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      currentLine1: saved.currentLine1 || '',
      currentLine2: saved.currentLine2 || '',
      currentPinCode: saved.currentPinCode || '',
      currentCity: saved.currentCity || '',
      currentState: saved.currentState || '',
      residenceType: saved.residenceType || '',
      rentAmount: saved.rentAmount || '',
      yearsAtCurrentAddress: saved.yearsAtCurrentAddress || '',
      hasPreviousAddress: saved.hasPreviousAddress || false,
      prevLine1: saved.prevLine1 || '',
      prevPinCode: saved.prevPinCode || '',
      prevCity: saved.prevCity || '',
      prevState: saved.prevState || '',
      sameAsPermanent: saved.sameAsPermanent !== undefined ? saved.sameAsPermanent : true,
      permLine1: saved.permLine1 || '',
      permPinCode: saved.permPinCode || '',
      permCity: saved.permCity || '',
      permState: saved.permState || '',
    },
    mode: 'onBlur',
  });

  const residenceType = watch('residenceType');
  const yearsAtCurrent = watch('yearsAtCurrentAddress');
  const sameAsPermanent = watch('sameAsPermanent');
  const showRent = residenceType === 'rented';
  const showPrevAddress = yearsAtCurrent !== '' && Number(yearsAtCurrent) < 1;
  const showPermAddress = !sameAsPermanent;

  // Copy current to permanent when checkbox checked
  const handleSameAsPermanent = (checked) => {
    if (checked) {
      const vals = watch(['currentLine1', 'currentLine2', 'currentPinCode', 'currentCity', 'currentState']);
      setValue('permLine1', vals[0] || '', { shouldValidate: true });
      setValue('permLine2', vals[1] || '', { shouldValidate: true });
      setValue('permPinCode', vals[2] || '', { shouldValidate: true });
      setValue('permCity', vals[3] || '', { shouldValidate: true });
      setValue('permState', vals[4] || '', { shouldValidate: true });
    } else {
      // Clear perm fields when unchecked so user must fill them
      setValue('permLine1', '', { shouldValidate: false });
      setValue('permLine2', '', { shouldValidate: false });
      setValue('permPinCode', '', { shouldValidate: false });
      setValue('permCity', '', { shouldValidate: false });
      setValue('permState', '', { shouldValidate: false });
    }
  };

  const onSubmit = (data) => {
    updateStepData(4, data);
    completeStep(4);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Address Information</h2>
          <p className="text-sm text-gray-500">Enter your current residential address.</p>
        </div>

        {/* Current Address */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <AddressBlock prefix="current" label="Current Address" register={register} errors={errors} setValue={setValue} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              id="residenceType"
              label="Residence Type"
              required
              placeholder="Select type"
              options={RESIDENCE_TYPES}
              error={errors.residenceType?.message}
              {...register('residenceType')}
            />

            {showRent && (
              <Input label="Monthly Rent Amount" id="rentAmount" required error={errors.rentAmount?.message}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                  <InputField
                    id="rentAmount"
                    type="number"
                    placeholder="15000"
                    className="pl-7"
                    inputMode="numeric"
                    error={errors.rentAmount?.message}
                    {...register('rentAmount')}
                  />
                </div>
              </Input>
            )}
          </div>

          <Input label="Years at Current Address" id="yearsAtCurrentAddress" required error={errors.yearsAtCurrentAddress?.message}>
            <InputField
              id="yearsAtCurrentAddress"
              type="number"
              placeholder="e.g. 3"
              min={0}
              max={50}
              inputMode="numeric"
              error={errors.yearsAtCurrentAddress?.message}
              {...register('yearsAtCurrentAddress')}
            />
          </Input>
        </div>

        {/* Previous Address (if < 1 year) */}
        {showPrevAddress && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-500">⚠️</span>
              <h3 className="text-sm font-semibold text-amber-800">Previous Address Required</h3>
            </div>
            <p className="text-xs text-amber-700 mb-3">Since you have been at current address for less than 1 year, please provide your previous address.</p>
            <AddressBlock prefix="prev" register={register} errors={errors} setValue={setValue} />
          </div>
        )}

        {/* Same as Permanent */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <Checkbox
            id="sameAsPermanent"
            label="Permanent address is same as current address"
            {...register('sameAsPermanent', {
              onChange: (e) => handleSameAsPermanent(e.target.checked),
            })}
          />

          {showPermAddress && (
            <div className="mt-4 animate-fade-in">
              <AddressBlock prefix="perm" label="Permanent Address" register={register} errors={errors} setValue={setValue} />
            </div>
          )}
        </div>
      </div>

      <StepNavigation onNext={handleSubmit(onSubmit)} onPrev={onPrev} />
    </form>
  );
}
