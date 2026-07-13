// ============================================================
// EMI Calculator - Reducing Balance Method
// EMI = P × r × (1+r)^n / ((1+r)^n – 1)
// ============================================================

export const INTEREST_RATES = {
  personal: 10.5,
  home: 8.5,
  business: 14.0,
};

export const PROCESSING_FEE_PERCENT = 1; // 1%
export const PROCESSING_FEE_MIN = 2000;  // ₹2,000
export const PROCESSING_FEE_MAX = 25000; // ₹25,000

/**
 * Calculate EMI
 * @param {number} principal - Loan amount in INR
 * @param {number} annualRate - Annual interest rate percentage
 * @param {number} tenureMonths - Loan tenure in months
 * @returns {number} Monthly EMI amount
 */
export function calculateEMI(principal, annualRate, tenureMonths) {
  if (!principal || !annualRate || !tenureMonths) return 0;

  const monthlyRate = annualRate / 12 / 100;

  if (monthlyRate === 0) return principal / tenureMonths;

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  return Math.round(emi);
}

/**
 * Calculate processing fee
 * @param {number} loanAmount
 * @returns {number} Processing fee in INR
 */
export function calculateProcessingFee(loanAmount) {
  const fee = (PROCESSING_FEE_PERCENT / 100) * loanAmount;
  return Math.min(Math.max(fee, PROCESSING_FEE_MIN), PROCESSING_FEE_MAX);
}

/**
 * Get full loan summary
 */
export function getLoanSummary(loanType, loanAmount, tenureMonths) {
  const annualRate = INTEREST_RATES[loanType] || INTEREST_RATES.personal;
  const emi = calculateEMI(loanAmount, annualRate, tenureMonths);
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - loanAmount;
  const processingFee = calculateProcessingFee(loanAmount);

  return {
    loanAmount,
    tenureMonths,
    annualRate,
    emi,
    totalPayment,
    totalInterest,
    processingFee,
    totalCostOfBorrowing: totalInterest,
  };
}

// ============================================================
// Indian Number Formatting
// e.g., 1000000 → "10,00,000"
// ============================================================
export function formatIndianCurrency(amount) {
  if (!amount && amount !== 0) return '₹0';
  const num = Math.round(Number(amount));
  const formatted = num.toLocaleString('en-IN');
  return `₹${formatted}`;
}

export function formatIndianNumber(num) {
  if (!num && num !== 0) return '0';
  return Math.round(Number(num)).toLocaleString('en-IN');
}

/**
 * Check EMI affordability
 * @param {number} emi - Monthly EMI
 * @param {number} monthlyIncome - Applicant's monthly income
 * @param {number} coApplicantIncome - Co-applicant income (optional)
 * @returns {{ affordable: boolean, ratio: number, warning: string|null }}
 */
export function checkEMIAffordability(emi, monthlyIncome, coApplicantIncome = 0) {
  const totalIncome = monthlyIncome + coApplicantIncome;
  if (!totalIncome) return { affordable: true, ratio: 0, warning: null };

  const ratio = (emi / totalIncome) * 100;

  if (ratio > 50) {
    return {
      affordable: false,
      ratio: Math.round(ratio),
      warning: `EMI (${formatIndianCurrency(emi)}) exceeds 50% of your monthly income (${formatIndianCurrency(totalIncome)}). Current ratio: ${Math.round(ratio)}%`,
    };
  }

  return { affordable: true, ratio: Math.round(ratio), warning: null };
}
