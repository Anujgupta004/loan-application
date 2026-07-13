// Tests 4-8: Validation Errors per Step (P0)
describe('Validation Errors', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  // ── Step 1 ────────────────────────────────────────────────
  it('Step 1 – shows required field errors on empty submit', () => {
    cy.assertStep('Loan Type');
    cy.contains('button', 'Continue').click();
    // Zod enum fires invalid_type or required_error for unselected radio
    cy.get('[role="alert"]', { timeout: 5000 }).should('be.visible');
  });

  it('Step 1 – shows amount below minimum for personal loan', () => {
    cy.get('input[name="loanType"][value="personal"]').check({ force: true });
    cy.get('#loanAmount').should('be.visible').clear().type('10000');
    cy.get('#loanAmount').blur();
    cy.contains('Minimum loan amount').should('be.visible');
  });

  it('Step 1 – shows amount exceeds maximum for personal loan', () => {
    cy.get('input[name="loanType"][value="personal"]').check({ force: true });
    cy.get('#loanAmount').should('be.visible').clear().type('2000000');
    cy.get('#loanAmount').blur();
    cy.contains('Maximum loan amount').should('be.visible');
  });

  // ── Step 2 ────────────────────────────────────────────────
  it('Step 2 – validates age minimum (under 21)', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.assertStep('Personal Information');

    // Fill all required fields first, then set invalid DOB
    const underageDate = new Date();
    underageDate.setFullYear(underageDate.getFullYear() - 20);
    const dobStr = underageDate.toISOString().split('T')[0];

    cy.get('#fullName').type('Test User');
    cy.get('#dateOfBirth').type(dobStr);
    cy.get('input[name="gender"][value="male"]').check({ force: true });
    cy.get('#maritalStatus').select('single');
    cy.get('#fatherName').type('Father Name');
    cy.get('#motherName').type('Mother Name');
    cy.get('#email').type('test@test.com');
    cy.get('#mobile').type('9876543210');
    cy.contains('button', 'Continue').click();
    cy.contains('Applicant must be at least 21', { timeout: 5000 }).should('be.visible');
  });

  it('Step 2 – validates mobile number format (starts with 1)', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.assertStep('Personal Information');
    cy.get('#mobile').clear().type('1234567890');
    cy.get('#mobile').blur();
    cy.contains('10 digits starting with 6').should('be.visible');
  });

  it('Step 2 – alternate mobile must differ from primary', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.assertStep('Personal Information');

    // Fill all required fields, then set duplicate mobile
    cy.get('#fullName').type('Test User');
    cy.get('#dateOfBirth').type('1990-01-01');
    cy.get('input[name="gender"][value="male"]').check({ force: true });
    cy.get('#maritalStatus').select('single');
    cy.get('#fatherName').type('Father Name');
    cy.get('#motherName').type('Mother Name');
    cy.get('#email').type('test@test.com');
    cy.get('#mobile').clear().type('9876543210');
    cy.get('#alternateMobile').clear().type('9876543210');
    cy.contains('button', 'Continue').click();
    cy.contains('Alternate mobile must be different', { timeout: 5000 }).should('be.visible');
  });

  // ── Step 3 ────────────────────────────────────────────────
  it('Step 3 – invalid PAN 4th character shows specific entity type error', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();

    cy.assertStep('Identity Verification');
    // 4th char 'D' is not a valid entity type
    cy.get('#panNumber').clear().type('ABCDE1234F').blur();
    cy.contains("not a valid entity type").should('be.visible');
  });

  it('Step 3 – short PAN shows format error', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();

    cy.assertStep('Identity Verification');
    cy.get('#panNumber').clear().type('ABC123').blur();
    cy.contains('format AAAAA9999A').should('be.visible');
  });

  it('Step 3 – Aadhaar with wrong length shows error', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();

    cy.assertStep('Identity Verification');
    cy.get('#aadhaarNumber').clear().type('12345678901').blur(); // 11 digits
    cy.contains('exactly 12 digits').should('be.visible');
  });

  it('Step 3 – cannot proceed without Aadhaar consent', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();

    cy.assertStep('Identity Verification');
    cy.get('#panNumber').clear().type('ABCPE1234F').blur();
    cy.wait(2000);
    cy.get('#aadhaarNumber').clear().type('499118665246').blur();
    cy.wait(2000);
    // Do NOT check consent
    cy.contains('button', 'Continue').click();
    cy.contains('consent').should('be.visible');
  });

  // ── Step 4 ────────────────────────────────────────────────
  it('Step 4 – shows address line 1 required error', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();

    cy.assertStep('Address Information');
    cy.contains('button', 'Continue').click();
    cy.contains('at least 5 characters').should('be.visible');
  });

  it('Step 4 – shows rent amount required when residence is rented', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();

    cy.assertStep('Address Information');
    cy.get('#currentLine1').type('Flat 101, Test Building, Main Road');
    cy.get('#currentPinCode').type('560001').blur();
    cy.wait(800);
    cy.get('#residenceType').select('rented');
    cy.get('#yearsAtCurrentAddress').type('3');
    cy.contains('button', 'Continue').click();
    cy.contains('Rent amount is required').should('be.visible');
  });

  // ── Step 5 ────────────────────────────────────────────────
  it('Step 5 – shows salary below minimum error', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();
    cy.fillStep4();
    cy.clickNext();

    cy.assertStep('Employment');
    cy.get('input[name="employmentType"][value="salaried"]').check({ force: true });
    cy.get('#companyName').type('Test Corp');
    cy.get('#designation').type('Engineer');
    cy.get('#monthlyNetSalary').type('10000').blur();
    cy.contains('Minimum salary').should('be.visible');
  });
});
