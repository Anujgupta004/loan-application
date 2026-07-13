# Architecture Documentation – LendSwift Loan Application

## 1. Wizard Pattern

The `Wizard` component acts as an orchestrator. It does not render form fields directly — it delegates to step components via a step registry:

```
Wizard
  ├── reads currentStep from FormStore
  ├── renders STEP_COMPONENTS[currentStep]
  ├── passes onNext / onPrev handlers
  └── calls useAutoSave on every formData change
```

Each step component is self-contained:
- Has its own `useForm` instance
- Validates using its own Zod schema
- On successful validation, calls `updateStepData(step, data)` → merges into store
- Calls `onNext()` to advance the Wizard

## 2. Schema Factory Pattern

Step schemas are not static — they accept context from other steps:

```js
createStep1Schema(dob)      // DOB from step 2 used for tenure age check
createStep3Schema(loanType) // PAN entity types vary by loan type
createStep5Schema(loanType) // Salaried blocked for business loans
```

This keeps validation logic co-located with each step while enabling cross-step rules.

## 3. Auto-Save Flow

```
formData changes
  → useAutoSave debounces (30s timer resets)
  → timer fires → serialize formData to JSON
  → encrypt with AES-256-GCM (Web Crypto API)
  → write to localStorage['lendswift_draft_{loanType}']
  → write metadata (version, timestamp, step) separately
  → show toast: "Draft saved at HH:MM"

On page load:
  → ResumeModal checks localStorage for drafts
  → Filter out expired drafts (> 72 hours)
  → If draft found → show modal
  → User picks Resume → decrypt → validate schema version → restore
  → User picks Start Fresh → clearDraft() → stay on Step 1
```

## 4. Cross-Step Dependency Management

The `FormStore` (`useReducer` + Context) is the single source of truth. Steps read from `formData` freely:

- `Step5Employment` reads `formData.step1.loanType` to filter employment options
- `Step6CoApplicant` reads `formData.step2.maritalStatus` for default relationship
- `Step7Documents` reads `formData.step1.loanType` + `formData.step5.employmentType` to build the document checklist
- `Step8Review` reads all steps to render the summary + EMI calculation
- `Step1LoanType` reads `formData.step2.dateOfBirth` to enforce age + tenure ≤ 65

## 5. Step 6 Dynamic Insertion

```js
// In FormStore
getEffectiveSteps() {
  if (isStep6Required()) return [1, 2, 3, 4, 5, 6, 7, 8];
  return [1, 2, 3, 4, 5, 7, 8]; // Step 6 absent
}

isStep6Required() {
  if (loanType === 'home') return true;
  if (loanType === 'personal') return amount > 500000;
  if (loanType === 'business') return amount > 2000000;
}
```

`getNextStep(current)` and `getPrevStep(current)` operate on the effective steps array — no step component needs conditional logic for this.

## 6. File Upload Pipeline

```
User drops/selects file
  → React Dropzone validates: type (PDF/JPG/PNG), size (≤ 5MB)
  → If image: compressImage()
      → Load into <img> via URL.createObjectURL
      → Draw to <canvas> at max 1200px width (aspect ratio preserved)  
      → canvas.toBlob(blob, 'image/jpeg', 0.7)
      → If blob > 2MB: retry with quality - 0.1 (min 0.3)
      → Return compressed File + size info
  → Generate preview: URL.createObjectURL (images) or null (PDF)
  → Store in component state: [{ file, preview, name, size }]
  → Show thumbnail / PDF icon + filename + size
  → Show compression info if image was compressed
```

## 7. Encryption Scheme

```
Passphrase → PBKDF2 (100,000 iterations, SHA-256) → 256-bit AES key
Random 16-byte salt + 12-byte IV per save
Encrypted = AES-256-GCM(plaintext, key, IV)
Stored = base64(salt || IV || ciphertext)

Decryption:
  base64decode → split salt(16) | IV(12) | ciphertext
  → PBKDF2(passphrase, salt) → key
  → AES-GCM decrypt(ciphertext, key, IV) → plaintext
```

## 8. EMI Calculation

```
P = loan amount
r = annualRate / 12 / 100  (monthly rate)
n = tenureMonths

EMI = P × r × (1+r)^n / ((1+r)^n − 1)

Processing Fee = clamp(P × 1%, 2000, 25000)
Total Interest = EMI × n − P
Total Cost of Borrowing = Total Interest
```
