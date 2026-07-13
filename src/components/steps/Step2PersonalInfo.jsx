import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStore } from '../../store/formStore';
import { step2Schema } from '../../schemas/step2Schema';
import Input, { InputField } from '../common/Input';
import Select from '../common/Select';
import RadioGroup from '../common/RadioGroup';
import StepNavigation from '../wizard/StepNavigation';
import { calculateAge } from '../../utils/validators';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

// Max DOB = today - 21 years; Min DOB = today - 65 years
function getMaxDOB() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 21);
  return d.toISOString().split('T')[0];
}
function getMinDOB() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 65);
  return d.toISOString().split('T')[0];
}

// Format age display
function getAgeLabel(age) {
  if (!age || age < 0) return null;
  if (age < 21) return { text: `Age: ${age} years (minimum 21 required)`, color: 'text-error' };
  if (age > 65) return { text: `Age: ${age} years (maximum 65 allowed)`, color: 'text-error' };
  return { text: `Age: ${age} years ✓`, color: 'text-accent' };
}

export default function Step2PersonalInfo({ onNext, onPrev }) {
  const { formData, updateStepData, completeStep } = useFormStore();
  const saved = formData.step2;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      fullName: saved.fullName || '',
      dateOfBirth: saved.dateOfBirth || '',
      gender: saved.gender || '',
      maritalStatus: saved.maritalStatus || '',
      fatherName: saved.fatherName || '',
      motherName: saved.motherName || '',
      email: saved.email || '',
      mobile: saved.mobile || '',
      alternateMobile: saved.alternateMobile || '',
    },
    mode: 'onBlur',
  });

  const dob = watch('dateOfBirth');
  const age = dob ? calculateAge(dob) : null;
  const ageLabel = getAgeLabel(age);

  const onSubmit = (data) => {
    updateStepData(2, data);
    completeStep(2);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Personal Information</h2>
          <p className="text-sm text-gray-500">Please enter your details exactly as per your PAN card.</p>
        </div>

        {/* Full Name */}
        <Input label="Full Name (as per PAN)" id="fullName" required error={errors.fullName?.message}
          helpText="Use only letters, spaces, and periods">
          <InputField
            id="fullName"
            placeholder="e.g. Rahul Kumar Sharma"
            autoComplete="name"
            aria-required="true"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
        </Input>

        {/* Date of Birth */}
        <Input label="Date of Birth" id="dateOfBirth" required error={errors.dateOfBirth?.message}
          helpText={ageLabel ? undefined : 'Must be between 21–65 years'}>
          <InputField
            id="dateOfBirth"
            type="date"
            min={getMinDOB()}
            max={getMaxDOB()}
            autoComplete="bday"
            aria-required="true"
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
          {ageLabel && (
            <p className={`mt-1 text-xs font-medium ${ageLabel.color}`} aria-live="polite">
              {ageLabel.text}
            </p>
          )}
        </Input>

        {/* Gender */}
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Gender"
              required
              name="gender"
              options={GENDER_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.gender?.message}
            />
          )}
        />

        {/* Marital Status */}
        <Select
          id="maritalStatus"
          label="Marital Status"
          required
          placeholder="Select marital status"
          options={MARITAL_STATUS_OPTIONS}
          error={errors.maritalStatus?.message}
          aria-required="true"
          {...register('maritalStatus')}
        />

        {/* Two columns: Father + Mother */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Father's Name" id="fatherName" required error={errors.fatherName?.message}>
            <InputField
              id="fatherName"
              placeholder="Father's full name"
              autoComplete="off"
              aria-required="true"
              error={errors.fatherName?.message}
              {...register('fatherName')}
            />
          </Input>
          <Input label="Mother's Name" id="motherName" required error={errors.motherName?.message}>
            <InputField
              id="motherName"
              placeholder="Mother's full name"
              autoComplete="off"
              aria-required="true"
              error={errors.motherName?.message}
              {...register('motherName')}
            />
          </Input>
        </div>

        {/* Email */}
        <Input label="Email Address" id="email" required error={errors.email?.message}>
          <InputField
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-required="true"
            error={errors.email?.message}
            {...register('email')}
          />
        </Input>

        {/* Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Mobile Number" id="mobile" required error={errors.mobile?.message}
            helpText="10 digits, starting with 6–9">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" aria-hidden="true">+91</span>
              <InputField
                id="mobile"
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                autoComplete="tel-national"
                aria-required="true"
                className="pl-10"
                aria-label="Mobile number, country code +91 pre-filled"
                error={errors.mobile?.message}
                {...register('mobile')}
              />
            </div>
          </Input>
          <Input label="Alternate Mobile" id="alternateMobile" error={errors.alternateMobile?.message}
            helpText="Optional">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" aria-hidden="true">+91</span>
              <InputField
                id="alternateMobile"
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                autoComplete="tel-national"
                className="pl-10"
                aria-label="Alternate mobile number, country code +91 pre-filled"
                error={errors.alternateMobile?.message}
                {...register('alternateMobile')}
              />
            </div>
          </Input>
        </div>
      </div>

      <StepNavigation onNext={handleSubmit(onSubmit)} onPrev={onPrev} />
    </form>
  );
}
