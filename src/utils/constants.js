// ============================================================
// Application Constants
// ============================================================

export const LOAN_TYPES = {
  PERSONAL: 'personal',
  HOME: 'home',
  BUSINESS: 'business',
};

export const LOAN_TYPE_LABELS = {
  personal: 'Personal Loan',
  home: 'Home Loan',
  business: 'Business Loan',
};

export const LOAN_LIMITS = {
  personal: { min: 50000, max: 1000000, label: '₹50,000 – ₹10,00,000' },
  home: { min: 50000, max: 10000000, label: '₹50,000 – ₹1,00,00,000' },
  business: { min: 50000, max: 5000000, label: '₹50,000 – ₹50,00,000' },
};

export const TENURE_RANGES = {
  personal: { min: 12, max: 60 },
  home: { min: 60, max: 360 },
  business: { min: 12, max: 120 },
};

export const LOAN_PURPOSES = {
  personal: [
    'Medical Emergency',
    'Education',
    'Wedding',
    'Travel',
    'Home Renovation',
    'Debt Consolidation',
    'Consumer Durables',
    'Other',
  ],
  home: [
    'Purchase of New Home',
    'Construction of House',
    'Home Renovation/Extension',
    'Plot Purchase',
    'Balance Transfer',
    'Other',
  ],
  business: [
    'Working Capital',
    'Business Expansion',
    'Equipment Purchase',
    'Inventory Financing',
    'Business Acquisition',
    'Export Finance',
    'Other',
  ],
};

export const EMPLOYMENT_TYPES = {
  SALARIED: 'salaried',
  SELF_EMPLOYED: 'self_employed',
  BUSINESS_OWNER: 'business_owner',
};

export const RESIDENCE_TYPES = [
  { value: 'owned', label: 'Owned' },
  { value: 'rented', label: 'Rented' },
  { value: 'company', label: 'Company Provided' },
  { value: 'family', label: 'Family Owned' },
];

export const RELATIONSHIP_TYPES = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'business_partner', label: 'Business Partner' },
  { value: 'other', label: 'Other' },
];

// Step 6 triggers
export const CO_APPLICANT_THRESHOLDS = {
  personal: 500000,   // > ₹5,00,000
  home: 0,            // Always required
  business: 2000000,  // > ₹20,00,000
};

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

export const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const DRAFT_KEY_PREFIX = 'lendswift_draft_';
export const DRAFT_TTL_HOURS = 72;
export const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export const STEP_LABELS = [
  'Loan Type',
  'Personal Info',
  'KYC',
  'Address',
  'Employment',
  'Co-Applicant',
  'Documents',
  'Review',
];

export const TOTAL_STEPS = 8;

export const BUSINESS_TYPES = [
  'Proprietorship',
  'Partnership',
  'Private Limited Company',
  'Public Limited Company',
  'LLP',
  'Trust',
  'Society',
  'Other',
];

export const STATES_LIST = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];
