// Test 15: Cross-Step Validation Dependencies (P0)
describe('Cross-Step Validation Dependencies', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('changing loan amount above threshold dynamically inserts Step 6', () => {
    // FIRST RUN: 3L personal loan — Step 6 should be skipped
    cy.fillStep1({ loanType: 'personal', amount: '300000', tenure: '36' });
    cy.clickNext();
    cy.assertStep('Personal Information');
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();
    cy.fillStep4();
    cy.clickNext();
    cy.fillStep5Salaried();
    cy.clickNext();
    // Step 6 skipped — lands on Documents
    cy.assertStep('Documents');

    // SECOND RUN: reload and do 8L — Step 6 should appear
    cy.clearLocalStorage();
    cy.visit('/');
    cy.fillStep1({ loanType: 'personal', amount: '800000', tenure: '48' });
    cy.clickNext();
    cy.assertStep('Personal Information');
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();
    cy.fillStep4();
    cy.clickNext();
    cy.fillStep5Salaried();
    cy.clickNext();

    // Step 6 should appear (8L > 5L threshold)
    cy.assertStep('Co-Applicant');
  });

  it('business loan blocks salaried employment type', () => {
    cy.fillStep1({ loanType: 'business', amount: '1000000', tenure: '60' });
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();
    cy.fillStep4();
    cy.clickNext();

    cy.assertStep('Employment');
    // Salaried option should not exist for business loan
    cy.get('input[name="employmentType"][value="salaried"]').should('not.exist');
  });

  it('DOB affects max loan tenure validation in Step 1', () => {
    cy.fillStep1({ loanType: 'personal', amount: '300000', tenure: '60' });
    cy.clickNext();
    cy.assertStep('Personal Information');

    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 55);
    const dobStr = dob.toISOString().split('T')[0];
    cy.fillStep2({ dob: dobStr });
    cy.clickNext();

    cy.assertStep('Identity Verification');
    cy.contains('button', 'Previous').click();
    cy.assertStep('Personal Information');
    cy.contains('button', 'Previous').click();
    cy.assertStep('Loan Type');

    // 55 + 5 = 60 <= 65, no age error
    cy.get('#loanTenure').select('60', { force: true });
    cy.contains('exceeds maximum age').should('not.exist');
    cy.contains('button', 'Continue').click();
    cy.assertStep('Personal Information');
  });

  it('EMI-to-income ratio warning shown when EMI > 50% income', () => {
    cy.fillStep1({ loanType: 'personal', amount: '900000', tenure: '12' });
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();
    cy.fillStep4();
    cy.clickNext();
    cy.fillStep5Salaried({ salary: '15000' });
    cy.clickNext();

    cy.assertStep('Co-Applicant');
    cy.get('#coApplicantName').type('Test CoApp');
    cy.get('#relationship').select('parent');
    cy.get('#coApplicantPAN').type('XYZPE9999G').blur();
    cy.wait(2000);
    cy.get('#coApplicantIncome').type('15000');
    cy.get('#coApplicantConsent').check({ force: true });
    cy.clickNext();

    cy.assertStep('Documents');
    cy.fillStep7({ panVerified: true });
    cy.contains('button', 'Continue').click();

    cy.assertStep('Review');
    cy.contains('50%').should('be.visible');
  });

  it('PAN verified in Step 3 makes PAN card upload optional in Step 7', () => {
    cy.fillStep1({ loanType: 'personal', amount: '300000', tenure: '36' });
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();
    cy.fillStep4();
    cy.clickNext();
    cy.fillStep5Salaried();
    cy.clickNext();

    cy.assertStep('Documents');
    cy.contains('Optional – PAN already verified').should('be.visible');
  });

  it('marital status married sets spouse as default co-applicant relationship', () => {
    cy.fillStep1({ loanType: 'home', amount: '3000000', tenure: '120' });
    cy.clickNext();
    cy.fillStep2({ maritalStatus: 'married' });
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();
    cy.fillStep4();
    cy.clickNext();
    cy.fillStep5Salaried();
    cy.clickNext();

    cy.assertStep('Co-Applicant');
    cy.get('#relationship').should('have.value', 'spouse');
  });
});
