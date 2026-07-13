import { useState } from 'react';
import { useFormStore } from '../../store/formStore';
import FileUpload from '../common/FileUpload';
import SignatureCanvas from '../common/SignatureCanvas';
import Button from '../common/Button';
import StepNavigation from '../wizard/StepNavigation';

// Document config per loan type + employment type
function getRequiredDocuments(loanType, employmentType, panVerified) {
  const docs = [];

  // Everyone
  docs.push({
    key: 'panCard',
    label: 'PAN Card Copy',
    required: !panVerified,
    helpText: panVerified ? 'Optional – PAN already verified' : 'Required',
    maxSize: 5 * 1024 * 1024,
  });

  docs.push({
    key: 'aadhaarFront',
    label: 'Aadhaar Card (Front)',
    required: true,
    maxSize: 5 * 1024 * 1024,
  });

  docs.push({
    key: 'aadhaarBack',
    label: 'Aadhaar Card (Back)',
    required: true,
    maxSize: 5 * 1024 * 1024,
  });

  docs.push({
    key: 'photograph',
    label: 'Passport Size Photograph',
    required: true,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: 2 * 1024 * 1024,
    helpText: 'JPG or PNG, max 2 MB',
  });

  docs.push({
    key: 'bankStatement',
    label: 'Bank Statements (Last 6 Months)',
    required: true,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    helpText: 'PDF only, max 10 MB',
    maxFiles: 2,
  });

  // Salaried
  if (employmentType === 'salaried') {
    docs.push({
      key: 'salarySlips',
      label: 'Salary Slips (Last 3 Months)',
      required: true,
      accept: { 'application/pdf': ['.pdf'] },
      maxSize: 5 * 1024 * 1024,
      maxFiles: 3,
      helpText: 'Upload last 3 salary slips (PDF)',
    });
  }

  // Self-employed or business owner
  if (employmentType === 'self_employed' || employmentType === 'business_owner') {
    docs.push({
      key: 'itrDocuments',
      label: 'Income Tax Returns (Last 2 Years)',
      required: true,
      accept: { 'application/pdf': ['.pdf'] },
      maxSize: 5 * 1024 * 1024,
      maxFiles: 2,
      helpText: 'Upload ITR for last 2 financial years',
    });
  }

  // Home loan
  if (loanType === 'home') {
    docs.push({
      key: 'propertyDocuments',
      label: 'Property Documents',
      required: true,
      accept: { 'application/pdf': ['.pdf'] },
      maxSize: 10 * 1024 * 1024,
      maxFiles: 3,
      helpText: 'Sale deed, NOC, property tax receipts, etc.',
    });
  }

  // Business loan
  if (loanType === 'business') {
    docs.push({
      key: 'businessRegistration',
      label: 'Business Registration Certificate',
      required: true,
      accept: { 'application/pdf': ['.pdf'] },
      maxSize: 5 * 1024 * 1024,
      helpText: 'GST registration, incorporation certificate, etc.',
    });
    docs.push({
      key: 'gstReturns',
      label: 'GST Returns (Last 4 Quarters)',
      required: true,
      accept: { 'application/pdf': ['.pdf'] },
      maxSize: 5 * 1024 * 1024,
      maxFiles: 4,
      helpText: 'GSTR-1 and GSTR-3B for last 4 quarters',
    });
  }

  return docs;
}

export default function Step7Documents({ onNext, onPrev }) {
  const { formData, updateStepData, completeStep } = useFormStore();
  const saved = formData.step7;

  const loanType = formData.step1?.loanType || 'personal';
  const employmentType = formData.step5?.employmentType || 'salaried';
  const panVerified = formData.step3?.panVerified || false;

  const requiredDocs = getRequiredDocuments(loanType, employmentType, panVerified);

  const [documents, setDocuments] = useState(saved.documents || {});
  const [signature, setSignature] = useState(saved.signature || null);
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);

  const updateDoc = (key, files) => {
    setDocuments((prev) => ({ ...prev, [key]: files }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  // Expose setDocuments + setSignature to Cypress for E2E testing
  // This allows tests to inject synthetic files without real file upload UI
  if (typeof window !== 'undefined' && window.Cypress) {
    window.__step7SetDocuments = setDocuments;
    window.__step7SetSignature = setSignature;
    window.__step7RequiredDocs = requiredDocs;
  }

  const validate = () => {
    const newErrors = {};
    requiredDocs.forEach((doc) => {
      if (doc.required) {
        const files = documents[doc.key];
        if (!files || files.length === 0) {
          newErrors[doc.key] = `${doc.label} is required`;
        }
      }
    });
    if (!signature) {
      newErrors.signature = 'E-signature is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setAttempted(true);
    if (validate()) {
      updateStepData(7, { documents, signature });
      completeStep(7);
      onNext();
    }
  };

  // Count uploaded vs required
  const requiredCount = requiredDocs.filter((d) => d.required).length + 1; // +1 for signature
  const uploadedCount = requiredDocs.filter((d) => d.required && documents[d.key]?.length > 0).length + (signature ? 1 : 0);
  const allDone = uploadedCount === requiredCount;
  const progressPercent = Math.round((uploadedCount / requiredCount) * 100);

  return (
    <div>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Documents & E-Signature</h2>
          <p className="text-sm text-gray-500">Upload required documents. Images are automatically compressed.</p>
        </div>

        {/* Progress */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-primary font-medium">Document Checklist</span>
            <span className={`text-sm font-semibold ${allDone ? 'text-accent' : 'text-gray-600'}`}>
              {uploadedCount} / {requiredCount} completed
            </span>
          </div>
          <div
            className="w-full bg-gray-200 rounded-full h-1.5"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${uploadedCount} of ${requiredCount} documents uploaded`}
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${allDone ? 'bg-accent' : 'bg-primary'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-5">
          {requiredDocs.map((doc) => (
            <div key={doc.key} className="bg-white border border-gray-200 rounded-lg p-4">
              <FileUpload
                id={doc.key}
                label={doc.label}
                required={doc.required}
                accept={doc.accept}
                maxSize={doc.maxSize || 5 * 1024 * 1024}
                maxFiles={doc.maxFiles || 1}
                value={documents[doc.key] || []}
                onChange={(files) => updateDoc(doc.key, files)}
                error={attempted ? errors[doc.key] : null}
                helpText={doc.helpText}
                compress={true}
              />
              {documents[doc.key]?.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-accent" aria-live="polite" aria-label={`${doc.label} uploaded successfully`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Uploaded
                </div>
              )}
            </div>
          ))}

          {/* E-Signature */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <SignatureCanvas
              label="E-Signature"
              required
              value={signature}
              onChange={setSignature}
              error={attempted ? errors.signature : null}
            />
            <p className="text-xs text-gray-500 mt-2">
              Your signature is legally valid under the IT Act 2000 (Section 3A). Draw using mouse or touch.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
        <Button variant="secondary" onClick={onPrev} type="button">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Button>
        <Button variant="primary" onClick={handleNext} type="button">
          Continue
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
