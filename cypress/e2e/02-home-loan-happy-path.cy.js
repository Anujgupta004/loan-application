// Test 2: Home Loan Happy Path (P0)
describe('Home Loan Happy Path', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('completes a home loan application with co-applicant', () => {
    // Step 1 - Home loan
    cy.assertStep('Loan Type');
    cy.fillStep1({ loanType: 'home', amount: '5000000', tenure: '180' });
    cy.clickNext();

    // Step 2
    cy.assertStep('Personal Information');
    cy.fillStep2({ maritalStatus: 'married' });
    cy.clickNext();

    // Step 3 - KYC
    cy.assertStep('Identity Verification');
    cy.fillStep3();
    cy.contains('button', 'Continue').click();

    // Step 4
    cy.assertStep('Address Information');
    cy.fillStep4();
    cy.clickNext();

    // Step 5
    cy.assertStep('Employment');
    cy.fillStep5Salaried();
    cy.clickNext();

    // Step 6 - Co-Applicant (always required for home loan)
    cy.assertStep('Co-Applicant');
    cy.get('#coApplicantName').clear().type('Priya Sharma');
    cy.get('#relationship').select('spouse');
    cy.get('#coApplicantPAN').clear().type('XYZPS9999G').blur();
    cy.wait(2000);
    cy.get('#coApplicantIncome').clear().type('50000');
    cy.get('#coApplicantConsent').check({ force: true });
    cy.clickNext();

    // Step 7 - Documents
    cy.assertStep('Documents');
    cy.fillStep7({ loanType: 'home', panVerified: true });
    cy.contains('button', 'Continue').click();

    // Step 8 - Review
    cy.assertStep('Review');
    cy.contains('Home Loan').should('be.visible');
    cy.contains('Priya Sharma').should('be.visible');

    // Consents
    cy.get('#consentAccurate').check({ force: true });
    cy.get('#consentCredit').check({ force: true });
    cy.get('#consentTerms').check({ force: true });

    // Submit
    cy.contains('button', 'Submit Application').click();
    cy.contains('Application Submitted', { timeout: 5000 }).should('be.visible');
    cy.contains('LEND-').should('be.visible');
  });
});
