# LendSwift – Digital Loan Application Form

A production-grade, 8-step multi-step loan application form built for LendSwift, a fictional Indian digital lending NBFC.

> **Assessment Project** — Zetheta Algorithms Pvt. Ltd. Front-End Developer Assessment

---

## Live Demo

> Run locally: `npm run dev` → http://localhost:5173

---

## Setup & Installation

```bash
npm install
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run test:e2e     # Run all 56 Cypress E2E tests (requires dev server)
npm run test:e2e:open # Open Cypress interactive runner
npm run lint         # ESLint with Airbnb config
```

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Build tool |
| React Hook Form | 7 | Uncontrolled form state (no keystroke re-renders) |
| Zod | 4 | Schema-based validation with cross-step rules |
| Tailwind CSS v4 | 4 | Utility-first responsive styling |
| React Dropzone | 15 | Drag-and-drop file upload |
| react-signature-canvas | 1.1 | E-signature capture |
| react-hot-toast | 2 | Auto-save toast notifications |
| Web Crypto API | native | AES-256-GCM encryption for LocalStorage |
| uuid | 14 | Application reference number generation |
| Cypress | 15 | End-to-end testing (56 tests, 13 spec files) |
| ESLint + Airbnb | latest | Code standards enforcement |

---

## Application Steps

| Step | Title | Key Features |
|------|-------|-------------|
| 1 | Loan Type & Amount | Personal/Home/Business, dynamic tenure, cross-step age+tenure validation |
| 2 | Personal Information | DOB age gate (21–65), Indian mobile validation, Verhoeff-ready |
| 3 | KYC | PAN entity-type validation + Aadhaar Verhoeff checksum, 1.5s verification simulation |
| 4 | Address | PIN code auto-fill, conditional rent/prev address, same-as-permanent checkbox |
| 5 | Employment | 3 sub-forms (Salaried/Self-Employed/Business Owner), GST validation, business loan gates |
| 6 | Co-Applicant | Conditional step (Home always, Personal >5L, Business >20L), marital default |
| 7 | Documents | Dynamic checklist per loan+employment type, Canvas compression, E-signature |
| 8 | Review & Submit | EMI summary, PAN/Aadhaar masked, Edit buttons, 4 consent checkboxes, RBI disclosure |

---

## Architecture Decisions

### 1. Wizard Pattern with Central Context Store
`Wizard.jsx` is an orchestrator — it reads `currentStep` from `FormStore` and renders `STEP_COMPONENTS[currentStep]`. Each step is self-contained with its own `useForm` instance. A `useReducer` + Context store (`FormProvider`) holds accumulated data across all steps.

**Why not Zustand?** `useReducer` + Context is sufficient for this use case and avoids an extra dependency.

**Why not a single `useForm`?** With 50+ fields, a single RHF instance would create a monolithic schema that makes cross-step dependencies harder to manage.

### 2. React Hook Form over Formik
RHF uses uncontrolled inputs internally (via refs) — field updates don't re-render the entire form. On a mid-range Android device with 50+ fields, Formik's controlled approach would cause noticeable input lag.

### 3. Zod over Yup
Zod is TypeScript-native and provides compile-time type inference. `z.discriminatedUnion()` cleanly handles Step 5's three employment sub-forms. `.superRefine()` supports cross-step dependency rules (e.g., age + tenure ≤ 65).

### 4. Step 6 Dynamic Insertion
`getEffectiveSteps()` in the store recalculates the active step list based on loan type and amount. `getNextStep()` and `getPrevStep()` navigate within this dynamic list — no step component needs conditional skip logic.

### 5. Auto-Save with AES-256-GCM
Loan data contains PII. The Web Crypto API (`window.crypto.subtle`) encrypts with PBKDF2 key derivation (100,000 iterations) + AES-256-GCM, random salt+IV per save. Drafts expire after 72 hours.

### 6. Image Compression Pipeline
Canvas API compresses uploaded images to max 1200px width at 0.7 JPEG quality. If still >2MB, quality reduces by 0.1 recursively (min 0.3). Achieves 60–80% size reduction.

---

## Cross-Step Validation (14 Rules)

| Source | Target | Rule |
|--------|--------|------|
| Step 1: Loan Type | Step 5 | Business Loan → no Salaried option |
| Step 1: Loan Type | Step 6 | Home Loan always triggers Step 6 |
| Step 1: Loan Type | Step 7 | Document requirements vary |
| Step 1: Loan Amount | Step 6 | Personal >5L or Business >20L triggers Step 6 |
| Step 1: Loan Amount+Tenure | Step 8 | EMI calculation |
| Step 2: Date of Birth | Step 1 | Age + tenure ≤ 65 years |
| Step 2: Marital Status | Step 6 | Spouse is default relationship |
| Step 3: PAN Verified | Step 7 | PAN copy upload becomes optional |
| Step 4: Residence Type | Step 4 | Rented → shows rent amount field |
| Step 5: Employment Type | Step 5 | Determines sub-form fields |
| Step 5: Employment Type | Step 7 | Salary slips vs ITR requirement |
| Step 5: Monthly Income | Step 8 | EMI ≤ 50% income check |
| Step 6: Co-Applicant Income | Step 8 | Combined income for EMI ratio |

---

## E2E Test Coverage (56 tests, 13 files)

| # | File | Tests | Coverage |
|---|------|-------|---------|
| 1 | `01-personal-loan-happy-path` | 1 | Full personal/salaried flow → submission |
| 2 | `02-home-loan-happy-path` | 1 | Home loan with co-applicant |
| 3 | `03-business-loan-happy-path` | 1 | Business loan with GST |
| 4 | `04-validation-errors` | 13 | Step 1–5 validation errors |
| 5 | `05-pin-code-lookup` | 4 | PIN auto-fill, not-found error |
| 6 | `06-employment-switching` | 5 | Employment type switching, field clearing |
| 7 | `07-step6-conditional` | 4 | Step 6 visibility conditions |
| 8 | `08-file-upload` | 4 | Upload, oversize, wrong type, no-docs block |
| 9 | `09-e-signature` | 3 | Capture, clear, review display |
| 10 | `10-auto-save-resume` | 4 | Save, reload, resume, expire |
| 11 | `11-keyboard-navigation` | 5 | Full keyboard accessibility |
| 12 | `12-stress-test` | 5 | Rapid clicks, back-forward, double-submit |
| 13 | `13-cross-step-dependencies` | 6 | All cross-step rules |

**Total: 56 tests — 56 passing ✅**

---

## Validation Algorithms

### PAN Validation
Format: `AAAAA9999A` — 4th character = entity type (P=Individual, C=Company, F=Firm).
Personal/Home loans: only `P`. Business loans: `P`, `C`, `F`.

### Aadhaar Verhoeff Checksum
Full Verhoeff algorithm with 3 lookup tables (multiplication, permutation, inverse). Validates checksum digit across all 12 digits.

### GST Validation
15-character format: state code (01–38) + PAN (10) + entity + Z + checksum.

### EMI Formula
```
EMI = P × r × (1+r)^n / ((1+r)^n - 1)
r = annual_rate / 12 / 100
```
Rates: Personal 10.5%, Home 8.5%, Business 14%

---

## Security

- PII fields (PAN, Aadhaar) masked in UI (show last 4 only)
- LocalStorage auto-save encrypted with AES-256-GCM
- No PII in console logs
- Form data cleared on successful submission
- Draft TTL: 72 hours

## Accessibility (WCAG 2.1 AA)

- All inputs have `<label>` via `htmlFor/id`
- Error messages use `role="alert"` + `aria-live="polite"`
- Step transitions move focus to first input
- Full keyboard navigation (Tab, Enter, Space, Arrows)
- Minimum 4.5:1 colour contrast
- 44×44px minimum touch targets
- Progress bar: `aria-valuenow/min/max`
- File upload status via `aria-live`
- Modal focus trap with Escape key support
- `autocomplete` attributes on all relevant fields

---

## Known Limitations

- Auto-save resume uses encrypted data; private→normal mode switch causes graceful "Start Fresh"
- File previews use `URL.createObjectURL` (revoked on unmount — not persisted across sessions)
- Cypress tests use synthetic file injection via `window.__step7SetDocuments` for E2E reliability
- Dev server must be running for Cypress tests

---

## Project Structure

```
src/
├── components/
│   ├── common/       Button, Input, Select, RadioGroup, Checkbox,
│   │                 CurrencyInput, FileUpload, SignatureCanvas, VerifiedBadge
│   ├── steps/        Step1–Step8
│   └── wizard/       Wizard, ProgressBar, StepNavigation, ResumeModal
├── hooks/            useAutoSave, useVerification, usePinCodeLookup, useFormPersistence
├── schemas/          step1Schema, step2Schema, schemaFactory
├── store/            FormProvider + useFormStore (useReducer + Context)
├── utils/            validators, emiCalculator, encryption, imageCompression, constants
└── data/             pinCodes.js (100+ Indian PIN codes)
cypress/
├── e2e/              13 test files, 56 test cases
├── fixtures/         valid-personal-loan.json, valid-home-loan.json,
│                     valid-business-loan.json, test-image.png, test-document.pdf
└── support/          commands.js (fillStep1-7, drawSignature, fillStep7, assertStep)
```

---

*Built for Zetheta Algorithms Pvt. Ltd. — LendSwift Front-End Developer Assessment*
