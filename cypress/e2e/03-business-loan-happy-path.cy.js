// Test 3: Business Loan Happy Path (P0)
describe('Business Loan Happy Path', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('completes a business loan application with GST and business registration', () => {
    // Step 1
    cy.assertStep('Loan Type');
    cy.fillStep1({ loanType: 'business', amount: '1500000', tenure: '60' });
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

    // Step 5 - Business employment (salaried blocked for business loans)
    cy.assertStep('Employment');
    cy.fillStep5Business();
    cy.clickNext();

    // Step 7 - Documents (no co-applicant: 15L < 20L threshold)
    cy.assertStep('Documents');
    cy.fillStep7({ loanType: 'business', employmentType: 'business_owner', panVerified: true });
    cy.contains('button', 'Continue').click();

    // Step 8 - Review
    cy.assertStep('Review');
    cy.contains('Business Loan').should('be.visible');

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
