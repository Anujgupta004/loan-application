# LendSwift – Digital Loan Application Form

A production-grade, 8-step multi-step loan application form built for LendSwift, a fictional Indian digital lending NBFC.

> **Assessment Project** — Zetheta Algorithms Pvt. Ltd. Front-End Developer Assessment (Project 1B)

---

## Live Demo

🌐 **Vercel (Primary):** https://loan-application-anujgupta004s-projects.vercel.app

🌐 **GitHub Pages:** https://anujgupta004.github.io/loan-application/

> Or run locally: `npm run dev` → http://localhost:5173

---

## Screenshots

| Step | Description |
|------|-------------|
| Step 1 | Loan Type & Amount selection with dynamic fields |
| Step 2 | Personal Information with DOB age validation |
| Step 3 | KYC — PAN + Aadhaar verification with badges |
| Step 4 | Address with PIN code auto-fill |
| Step 5 | Employment with 3 sub-forms (Salaried/Self-Employed/Business) |
| Step 6 | Co-Applicant (conditional — Home/Personal >5L/Business >20L) |
| Step 7 | Document upload + E-Signature canvas |
| Step 8 | Review + Pre-Approval Summary + EMI Calculator + Submit |

> Live preview: **https://loan-application-anujgupta004s-projects.vercel.app**

---

## Setup & Installation

```bash
npm install
npm run dev           # Development server → http://localhost:5173
npm run build         # Production build
npm run preview       # Preview production build
npm run test:e2e      # Run all 61 Cypress E2E tests (requires dev server)
npm run test:e2e:open # Open Cypress interactive runner
npm run lint          # ESLint with Airbnb config
npm run deploy        # Deploy to GitHub Pages
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
| Cypress | 15 | End-to-end testing (61 tests, 14 spec files) |
| cypress-axe | latest | Automated WCAG 2.1 AA accessibility audit |
| ESLint + Airbnb | latest | Code standards enforcement |

---

## Application Steps

| Step | Title | Key Features |
|------|-------|-------------|
| 1 | Loan Type & Amount | Personal/Home/Business, dynamic tenure, cross-step age+tenure validation |
| 2 | Personal Information | DOB age gate (21–65), Indian mobile validation, colour-coded age feedback |
| 3 | KYC | PAN entity-type validation + Aadhaar Verhoeff checksum, 1.5s verification simulation, success banner |
| 4 | Address | PIN code auto-fill, conditional rent/prev address, same-as-permanent checkbox |
| 5 | Employment | 3 sub-forms via z.discriminatedUnion, GST validation, business loan gates |
| 6 | Co-Applicant | Conditional step, marital status default, RBI guideline message |
| 7 | Documents | Dynamic checklist per loan+employment type, Canvas compression, animated progress bar, E-signature |
| 8 | Review & Submit | EMI summary, PAN/Aadhaar masked, Edit buttons, 4 consent checkboxes, RBI disclosure, UUID ref |

---

## Architecture Decisions

### 1. Wizard Pattern with Central Context Store
`Wizard.jsx` is an orchestrator — renders `STEP_COMPONENTS[currentStep]` via React.lazy for code splitting. A `useReducer` + Context store (`FormProvider`) holds accumulated data across all steps.

**Why not Zustand?** `useReducer` + Context is sufficient and avoids extra dependency.

**Why not a single `useForm`?** With 50+ fields, a monolithic schema makes cross-step dependencies harder to manage.

### 2. React Hook Form over Formik
RHF uses uncontrolled inputs — field updates don't re-render the entire form. On a mid-range Android device with 50+ fields, Formik's controlled approach would cause noticeable input lag.

### 3. Zod over Yup
`z.discriminatedUnion()` cleanly handles Step 5's three employment sub-forms. `.superRefine()` supports cross-step rules (age + tenure ≤ 65).

### 4. Step 6 Dynamic Insertion
`getEffectiveSteps()` returns `[1,2,3,4,5,6,7,8]` or `[1,2,3,4,5,7,8]` based on loan type and amount. No step component needs conditional skip logic.

### 5. Auto-Save with AES-256-GCM
PBKDF2 key derivation (100,000 iterations) + AES-256-GCM, random salt+IV per save. Drafts expire after 72 hours. Decryption failure handled gracefully.

### 6. React.lazy + Suspense
All 8 step components are lazy-loaded. Main bundle: **71KB gzipped** (requirement: <300KB).

### 7. Image Compression Pipeline
Canvas API compresses images to max 1200px at 0.7 JPEG quality. Recursive quality reduction (min 0.3) until ≤2MB.

---

## Cross-Step Validation (14 Rules — All Implemented)

| Source | Target | Rule |
|--------|--------|------|
| Step 1: Loan Type | Step 5 | Business Loan → no Salaried option |
| Step 1: Loan Type | Step 6 | Home Loan always triggers Step 6 |
| Step 1: Loan Type | Step 7 | Document requirements vary |
| Step 1: Loan Amount | Step 6 | Personal >5L or Business >20L triggers Step 6 |
| Step 1: Amount+Tenure | Step 8 | EMI = f(amount, tenure, rate) |
| Step 1: Loan Tenure | Step 8 | Used in EMI formula |
| Step 2: Date of Birth | Step 1 | Age + tenure ≤ 65 years |
| Step 2: Marital Status | Step 6 | Spouse is default co-applicant relationship |
| Step 3: PAN Verified | Step 7 | PAN copy upload becomes optional |
| Step 3: Passport | Step 3 | Shown only for Home Loan > ₹50L |
| Step 4: Residence Type | Step 4 | Rented → shows rent amount field |
| Step 5: Employment Type | Step 5 | Determines sub-form fields |
| Step 5: Employment Type | Step 7 | Salary slips vs ITR requirement |
| Step 5: Monthly Income | Step 8 | EMI ≤ 50% income check |
| Step 6: Co-Applicant Income | Step 8 | Combined income for EMI ratio |

---

## E2E Test Coverage (61 tests, 14 files — All Passing)

| # | File | Tests | Coverage |
|---|------|-------|---------|
| 1 | `01-personal-loan-happy-path` | 1 | Full personal/salaried flow |
| 2 | `02-home-loan-happy-path` | 1 | Home loan with co-applicant |
| 3 | `03-business-loan-happy-path` | 1 | Business loan with GST |
| 4 | `04-validation-errors` | 13 | Step 1–5 validation errors |
| 5 | `05-pin-code-lookup` | 4 | PIN auto-fill, errors |
| 6 | `06-employment-switching` | 5 | Type switching, field clearing |
| 7 | `07-step6-conditional` | 4 | Step 6 visibility |
| 8 | `08-file-upload` | 4 | Upload, oversize, wrong type |
| 9 | `09-e-signature` | 3 | Capture, clear, review display |
| 10 | `10-auto-save-resume` | 4 | Save, reload, resume, expire |
| 11 | `11-keyboard-navigation` | 5 | Full keyboard accessibility |
| 12 | `12-stress-test` | 5 | Rapid clicks, double-submit |
| 13 | `13-cross-step-dependencies` | 6 | All cross-step rules |
| 14 | `14-accessibility-audit` | 5 | cypress-axe WCAG 2.1 AA |

---

## Validation Algorithms

### PAN Validation
Format `AAAAA9999A` — 4th character = entity type. Personal/Home: only `P`. Business: `P`, `C`, `F`.

### Aadhaar Verhoeff Checksum
Full Verhoeff algorithm (3 lookup tables). Validates checksum across all 12 digits.

### GST Validation
15-character: state code (01–38) + PAN (10) + entity + Z + checksum.

### EMI Formula
```
EMI = P × r × (1+r)^n / ((1+r)^n - 1)
r = annual_rate / 12 / 100
```
Rates: Personal 10.5%, Home 8.5%, Business 14%

---

## Security

- PII fields (PAN, Aadhaar) masked in UI (show last 4 only)
- LocalStorage auto-save: AES-256-GCM with PBKDF2 key derivation
- No PII in console logs
- Form data cleared on submission
- `.env.local` in `.gitignore`

## Accessibility (WCAG 2.1 AA)

- All inputs have `<label>` via `htmlFor/id`
- Error messages: `role="alert"` + `aria-live="polite"`
- Step transitions move focus to first input
- Full keyboard navigation
- Minimum 4.5:1 colour contrast
- 44×44px minimum touch targets
- Progress bar: `aria-valuenow/min/max`
- Modal focus trap with Escape key
- `autocomplete` attributes on all fields
- `aria-required="true"` on required inputs
- cypress-axe automated WCAG audit

---

## Performance

| Metric | Value | Requirement |
|--------|-------|-------------|
| Main bundle (gzipped) | **71KB** | <300KB ✅ |
| Step components | Lazy-loaded (8 chunks) | Code-split ✅ |
| Total gzipped | ~148KB | — |

---

## Git Workflow

- **47 commits** (Conventional Commits format)
- **11 feature branches** (feature/step-1 through feature/accessibility-audit)
- All commits <500 lines changed
- Types used: `feat`, `fix`, `refactor`, `docs`, `chore`, `perf`, `ci`, `test`, `style`

---

## Known Limitations

- Auto-save resume: private→normal mode switch causes graceful "Start Fresh"
- File previews use `URL.createObjectURL` (revoked on unmount)
- Cypress tests use `window.__step7SetDocuments` injection for E2E reliability
- Dev server must be running for Cypress tests

---

## Project Structure

```
src/
├── components/
│   ├── common/       Button, Input, Select, RadioGroup, Checkbox,
│   │                 CurrencyInput, FileUpload, SignatureCanvas,
│   │                 VerifiedBadge, MaskedInput
│   ├── steps/        Step1–Step8 (lazy-loaded)
│   └── wizard/       Wizard, ProgressBar, StepNavigation, ResumeModal
├── hooks/            useAutoSave, useVerification, usePinCodeLookup,
│                     useFormPersistence
├── schemas/          step1Schema, step2Schema, schemaFactory
├── store/            FormProvider + useFormStore (useReducer + Context)
├── utils/            validators, emiCalculator, encryption,
│                     imageCompression, constants
└── data/             pinCodes.js (100+ Indian PIN codes)
cypress/
├── e2e/              14 test files, 61 test cases (all passing)
├── fixtures/         Test data + synthetic file fixtures
└── support/          commands.js, e2e.js (cypress-axe)
```

---

## Submission Details

- **GitHub:** https://github.com/Anujgupta004/loan-application
- **Vercel:** https://loan-application-anujgupta004s-projects.vercel.app
- **GitHub Pages:** https://anujgupta004.github.io/loan-application/

---

*Built for Zetheta Algorithms Pvt. Ltd. — LendSwift Front-End Developer Assessment (Project 1B)*
