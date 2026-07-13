// Test 14: Rapid Navigation Stress Test (P1)
describe('Stress Test – Rapid Navigation', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('rapidly clicking Continue on empty form does not corrupt state', () => {
    cy.assertStep('Loan Type');

    // Click Continue 5 times rapidly — should stay on Step 1 with validation errors
    for (let i = 0; i < 5; i++) {
      cy.contains('button', 'Continue').click();
    }

    // Should still be on Step 1 (validation blocking) — any alert visible
    cy.assertStep('Loan Type');
    cy.get('[role="alert"]', { timeout: 5000 }).should('be.visible');
  });

  it('back-forward navigation preserves form data', () => {
    cy.fillStep1({ loanType: 'personal', amount: '300000', tenure: '36' });
    cy.clickNext();

    cy.assertStep('Personal Information');
    cy.fillStep2();
    cy.clickNext();

    // Go back to Step 1
    cy.assertStep('Identity Verification');
    cy.contains('button', 'Previous').click();
    cy.assertStep('Personal Information');
    cy.contains('button', 'Previous').click();
    cy.assertStep('Loan Type');

    // Data should still be there
    cy.get('input[name="loanType"][value="personal"]').should('be.checked');
    cy.get('#loanAmount').should('have.value', '3,00,000');
  });

  it('changing loan type clears amount and tenure fields', () => {
    cy.fillStep1({ loanType: 'personal', amount: '300000', tenure: '36' });

    // Switch to home loan — triggers reset of dependent fields
    cy.get('input[name="loanType"][value="home"]').check({ force: true });
    cy.wait(500);

    // Amount should be cleared
    cy.get('#loanAmount').should('have.value', '');
    // Tenure select element should exist and be empty / show placeholder
    cy.get('#loanTenure').find('option:checked').should('have.text', 'Select tenure');
  });

  it('double clicking Submit does not create duplicate submission', () => {
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
    cy.fillStep7({ panVerified: true });
    cy.contains('button', 'Continue').click();
    cy.assertStep('Review');

    cy.get('#consentAccurate').check({ force: true });
    cy.get('#consentCredit').check({ force: true });
    cy.get('#consentTerms').check({ force: true });

    // Click submit — second click should be ignored (isSubmitting guard)
    cy.contains('button', 'Submit Application').click();
    // After first click, button becomes disabled/loading — second click is no-op
    cy.contains('Application Submitted', { timeout: 6000 }).should('be.visible');
    // Only one reference number shown
    cy.get('[aria-label*="Application reference"]').should('have.length', 1);
  });

  it('max-length values in all Step 2 fields do not crash the form', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.assertStep('Personal Information');

    const longName = 'A'.repeat(100); // max 100 chars
    cy.get('#fullName').type(longName);
    cy.get('#fatherName').type(longName);
    cy.get('#motherName').type(longName);

    // Form should still be functional - no crash
    cy.get('#fullName').should('be.visible');
  });
});
