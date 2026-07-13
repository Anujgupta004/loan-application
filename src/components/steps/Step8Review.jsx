import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useFormStore } from '../../store/formStore';
import { getLoanSummary, formatIndianCurrency, checkEMIAffordability } from '../../utils/emiCalculator';
import { LOAN_TYPE_LABELS } from '../../utils/constants';
import Checkbox from '../common/Checkbox';
import Button from '../common/Button';

// ── Section card with uniquely labelled Edit button ───────────
function SectionCard({ title, stepNum, onEdit, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(stepNum)}
          aria-label={`Edit ${title}`}
          className="text-xs text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 py-1 min-h-[44px]"
        >
          Edit
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function DataRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 w-40 flex-shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right flex-1">{value}</span>
    </div>
  );
}

function maskPAN(pan) {
  if (!pan) return '';
  return pan.slice(0, 3) + '*****' + pan.slice(-2);
}

function maskAadhaar(aadhaar) {
  if (!aadhaar) return '';
  const d = aadhaar.replace(/\s/g, '');
  return 'XXXX XXXX ' + d.slice(-4);
}

export default function Step8Review({ onPrev }) {
  const { formData, setStep, setSubmitted, resetForm } = useFormStore();

  // Mandatory consents only — communications is optional (regulatory requirement)
  const [consents, setConsents] = useState({
    accurateInfo: formData.step8?.consents?.accurateInfo || false,
    creditCheck: formData.step8?.consents?.creditCheck || false,
    termsConditions: formData.step8?.consents?.termsConditions || false,
    communications: formData.step8?.consents?.communications || false,
  });
  const [consentErrors, setConsentErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmittedLocal] = useState(false);
  const [appId, setAppId] = useState(null);

  const { step1, step2, step3, step4, step5, step6, step7 } = formData;

  // EMI Calculations
  const loanSummary =
    step1?.loanType && step1?.loanAmount && step1?.loanTenure
      ? getLoanSummary(
          step1.loanType,
          Number(String(step1.loanAmount).replace(/,/g, '')),
          Number(step1.loanTenure)
        )
      : null;

  const coIncome = step6?.coApplicantIncome
    ? Number(String(step6.coApplicantIncome).replace(/,/g, ''))
    : 0;

  const primaryIncome = step5?.monthlyNetSalary
    ? Number(String(step5.monthlyNetSalary).replace(/,/g, ''))
    : step5?.monthlyIncome
    ? Number(String(step5.monthlyIncome).replace(/,/g, ''))
    : 0;

  const affordability = loanSummary
    ? checkEMIAffordability(loanSummary.emi, primaryIncome, coIncome)
    : null;

  // Only the 3 mandatory consents gate the submit button
  const mandatoryConsentsChecked =
    consents.accurateInfo && consents.creditCheck && consents.termsConditions;

  const handleConsentChange = (key, val) => {
    setConsents((prev) => ({ ...prev, [key]: val }));
    setConsentErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleSubmit = async () => {
    const errors = {};
    if (!consents.accurateInfo) errors.accurateInfo = 'Please confirm information accuracy';
    if (!consents.creditCheck) errors.creditCheck = 'Please authorize credit bureau check';
    if (!consents.termsConditions) errors.termsConditions = 'Please accept Terms & Conditions';

    if (Object.keys(errors).length > 0) {
      setConsentErrors(errors);
      return;
    }

    // Prevent double-submit
    if (isSubmitting) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));

    const applicationId = `LEND-${uuidv4().toUpperCase().slice(0, 8)}`;
    setAppId(applicationId);
    setSubmitted(applicationId);
    setSubmittedLocal(true);
    setIsSubmitting(false);

    // Clear draft
    const loanType = step1?.loanType;
    if (loanType) {
      localStorage.removeItem(`lendswift_draft_${loanType}`);
      localStorage.removeItem(`lendswift_draft_${loanType}_meta`);
    }
  };

  // ── Success Screen ────────────────────────────────────────────
  if (submitted && appId) {
    return (
      <div
        className="text-center py-12 animate-fade-in"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
        <p className="text-gray-500 mb-4">Your loan application has been received successfully.</p>
        <div className="inline-block bg-primary/5 border border-primary/20 rounded-xl px-8 py-4 mb-6">
          <p className="text-xs text-gray-500 mb-1">Application Reference Number</p>
          <p className="text-xl font-bold text-primary font-mono" aria-label={`Application reference number: ${appId}`}>{appId}</p>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          You will receive updates on {step2?.email}.<br />
          Our team will review your application within 2–3 business days.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 max-w-md mx-auto mb-6">
          <p><strong>Grievance Officer:</strong> grievance@lendswift.in</p>
          <p><strong>RBI Ombudsman:</strong> cms.rbi.org.in</p>
          <p><strong>Cooling-Off Period:</strong> 3 business days after disbursement</p>
        </div>
        <Button variant="primary" onClick={() => { resetForm(); window.location.reload(); }}>
          Start New Application
        </Button>
      </div>
    );
  }

  // ── Review Screen ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Review & Submit</h2>
        <p className="text-sm text-gray-500">Review all details carefully before submitting.</p>
      </div>

      {/* Pre-Approval Summary */}
      {loanSummary && (
        <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl p-5">
          <h3 className="text-sm font-semibold opacity-80 mb-3 uppercase tracking-wide">Pre-Approval Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs opacity-70">Loan Amount</p>
              <p className="text-lg font-bold">{formatIndianCurrency(loanSummary.loanAmount)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Monthly EMI</p>
              <p className="text-lg font-bold">{formatIndianCurrency(loanSummary.emi)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Interest Rate</p>
              <p className="text-base font-semibold">{loanSummary.annualRate}% p.a.</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Tenure</p>
              <p className="text-base font-semibold">{loanSummary.tenureMonths} months</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Total Interest</p>
              <p className="text-base font-semibold">{formatIndianCurrency(loanSummary.totalInterest)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Processing Fee</p>
              <p className="text-base font-semibold">{formatIndianCurrency(loanSummary.processingFee)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="flex justify-between items-center">
              <span className="text-xs opacity-70">Total Cost of Borrowing</span>
              <span className="text-base font-bold">{formatIndianCurrency(loanSummary.totalPayment)}</span>
            </div>
          </div>
          {affordability && !affordability.affordable && (
            <div className="mt-3 bg-warning/20 border border-warning/40 rounded-lg p-2" role="alert" aria-live="assertive">
              <p className="text-xs text-warning font-medium">⚠️ {affordability.warning}</p>
            </div>
          )}
          {affordability?.affordable && primaryIncome > 0 && (
            <p className="text-xs opacity-70 mt-2" aria-live="polite">
              EMI-to-Income Ratio: {affordability.ratio}% ✓ Within 50% limit
            </p>
          )}
        </div>
      )}

      {/* Section Cards */}
      <SectionCard title="Loan Details" stepNum={1} onEdit={setStep}>
        <DataRow label="Loan Type" value={step1?.loanType ? LOAN_TYPE_LABELS[step1.loanType] : '-'} />
        <DataRow label="Loan Amount" value={step1?.loanAmount ? formatIndianCurrency(Number(String(step1.loanAmount).replace(/,/g, ''))) : '-'} />
        <DataRow label="Tenure" value={step1?.loanTenure ? `${step1.loanTenure} months` : '-'} />
        <DataRow label="Purpose" value={step1?.loanPurpose} />
      </SectionCard>

      <SectionCard title="Personal Information" stepNum={2} onEdit={setStep}>
        <DataRow label="Full Name" value={step2?.fullName} />
        <DataRow label="Date of Birth" value={step2?.dateOfBirth} />
        <DataRow label="Gender" value={step2?.gender ? step2.gender.charAt(0).toUpperCase() + step2.gender.slice(1) : ''} />
        <DataRow label="Marital Status" value={step2?.maritalStatus ? step2.maritalStatus.charAt(0).toUpperCase() + step2.maritalStatus.slice(1) : ''} />
        <DataRow label="Email" value={step2?.email} />
        <DataRow label="Mobile" value={step2?.mobile ? `+91 ${step2.mobile}` : ''} />
      </SectionCard>

      <SectionCard title="KYC Details" stepNum={3} onEdit={setStep}>
        <DataRow label="PAN Number" value={step3?.panNumber ? maskPAN(step3.panNumber) : ''} />
        <DataRow label="Aadhaar Number" value={step3?.aadhaarNumber ? maskAadhaar(step3.aadhaarNumber) : ''} />
        <DataRow label="PAN Status" value={step3?.panVerified ? '✓ Verified' : 'Pending'} />
        <DataRow label="Aadhaar Status" value={step3?.aadhaarVerified ? '✓ Verified' : 'Pending'} />
      </SectionCard>

      <SectionCard title="Address" stepNum={4} onEdit={setStep}>
        <DataRow
          label="Current Address"
          value={step4?.currentLine1 ? `${step4.currentLine1}, ${step4.currentCity}, ${step4.currentState} – ${step4.currentPinCode}` : ''}
        />
        <DataRow label="Residence Type" value={step4?.residenceType ? step4.residenceType.charAt(0).toUpperCase() + step4.residenceType.slice(1) : ''} />
      </SectionCard>

      <SectionCard title="Employment & Income" stepNum={5} onEdit={setStep}>
        <DataRow
          label="Employment Type"
          value={step5?.employmentType === 'salaried' ? 'Salaried' : step5?.employmentType === 'self_employed' ? 'Self-Employed' : 'Business Owner'}
        />
        {step5?.companyName && <DataRow label="Company" value={step5.companyName} />}
        {step5?.businessName && <DataRow label="Business" value={step5.businessName} />}
        <DataRow
          label="Monthly Income"
          value={
            step5?.monthlyNetSalary
              ? formatIndianCurrency(Number(String(step5.monthlyNetSalary).replace(/,/g, '')))
              : step5?.monthlyIncome
              ? formatIndianCurrency(Number(String(step5.monthlyIncome).replace(/,/g, '')))
              : ''
          }
        />
        {step5?.gstNumber && <DataRow label="GST Number" value={step5.gstNumber} />}
      </SectionCard>

      {formData.step6?.coApplicantName && (
        <SectionCard title="Co-Applicant" stepNum={6} onEdit={setStep}>
          <DataRow label="Name" value={step6?.coApplicantName} />
          <DataRow label="Relationship" value={step6?.relationship} />
          <DataRow
            label="Monthly Income"
            value={step6?.coApplicantIncome ? formatIndianCurrency(Number(String(step6.coApplicantIncome).replace(/,/g, ''))) : ''}
          />
        </SectionCard>
      )}

      {/* E-Signature */}
      {step7?.signature && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">E-Signature</h3>
          <img
            src={step7.signature}
            alt="Your captured e-signature for this loan application"
            className="max-h-24 border border-gray-200 rounded p-2 bg-gray-50"
          />
        </div>
      )}

      {/* Consents — wrapped in fieldset for WCAG 1.3.1 */}
      <fieldset className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <legend className="text-sm font-semibold text-gray-800 px-1">Declarations &amp; Consents</legend>

        <Checkbox
          id="consentAccurate"
          required
          error={consentErrors.accurateInfo}
          label="I confirm that all information provided in this application is accurate, complete, and true to the best of my knowledge."
          checked={consents.accurateInfo}
          onChange={(e) => handleConsentChange('accurateInfo', e.target.checked)}
        />
        <Checkbox
          id="consentCredit"
          required
          error={consentErrors.creditCheck}
          label="I authorize LendSwift to access and verify my credit history from CIBIL, Equifax, Experian, or any other credit bureau for the purpose of this loan application."
          checked={consents.creditCheck}
          onChange={(e) => handleConsentChange('creditCheck', e.target.checked)}
        />
        <Checkbox
          id="consentTerms"
          required
          error={consentErrors.termsConditions}
          label={
            <>
              I have read and agree to the{' '}
              <a href="#" className="text-primary underline">Terms and Conditions</a>{' '}
              and{' '}
              <a href="#" className="text-primary underline">Privacy Policy</a>{' '}
              of LendSwift.
            </>
          }
          checked={consents.termsConditions}
          onChange={(e) => handleConsentChange('termsConditions', e.target.checked)}
        />
        {/* Optional marketing consent */}
        <Checkbox
          id="consentComms"
          error={consentErrors.communications}
          label="(Optional) I consent to receive marketing communications (SMS, email, WhatsApp) from LendSwift regarding offers and updates."
          checked={consents.communications}
          onChange={(e) => handleConsentChange('communications', e.target.checked)}
        />
      </fieldset>

      {/* RBI Disclosure */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500 space-y-1">
        <p><strong>Cooling-Off Period:</strong> You have the right to exit this loan within 3 business days of disbursement without penalty.</p>
        <p><strong>Grievance Officer:</strong> grievance@lendswift.in | 1800-XXX-XXXX</p>
        <p><strong>RBI Ombudsman:</strong> For unresolved complaints, visit cms.rbi.org.in</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button variant="secondary" onClick={onPrev} type="button">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Button>
        <Button
          variant="success"
          onClick={handleSubmit}
          disabled={!mandatoryConsentsChecked || isSubmitting}
          isLoading={isSubmitting}
          size="lg"
          aria-describedby={!mandatoryConsentsChecked ? 'consent-hint' : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Submit Application
        </Button>
      </div>
      {!mandatoryConsentsChecked && (
        <p id="consent-hint" className="text-xs text-gray-400 text-right" aria-live="polite">
          Please accept the 3 mandatory consents above to submit.
        </p>
      )}
    </div>
  );
}
