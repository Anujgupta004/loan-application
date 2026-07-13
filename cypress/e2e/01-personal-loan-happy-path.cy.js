// Test 1: Personal Loan Happy Path (P0)
describe('Personal Loan Happy Path', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('completes a full personal loan application with salaried employment', () => {
    // Step 1
    cy.assertStep('Loan Type');
    cy.fillStep1({ loanType: 'personal', amount: '300000', tenure: '36' });
    cy.clickNext();

    // Step 2
    cy.assertStep('Personal Information');
    cy.fillStep2();
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

    // Step 7 (no co-applicant for 3L personal loan - below 5L threshold)
    cy.assertStep('Documents');
    cy.fillStep7({ panVerified: true });
    cy.contains('button', 'Continue').click();

    // Step 8 - Review
    cy.assertStep('Review');
    cy.contains('Personal Loan').should('be.visible');
    cy.contains('₹').should('be.visible');

    // Consent checkboxes
    cy.get('#consentAccurate').check({ force: true });
    cy.get('#consentCredit').check({ force: true });
    cy.get('#consentTerms').check({ force: true });
    cy.get('#consentComms').check({ force: true });

    // Submit
    cy.contains('button', 'Submit Application').click();
    cy.contains('Application Submitted', { timeout: 5000 }).should('be.visible');
    cy.contains('LEND-').should('be.visible');
  });
});
