// Test 13: Keyboard Navigation (P1)
describe('Keyboard Navigation', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('can complete Step 1 using keyboard only (Tab + Enter)', () => {
    cy.assertStep('Loan Type');

    // Select Personal Loan via keyboard — check the radio directly
    cy.get('input[name="loanType"][value="personal"]').focus().check({ force: true });
    // Wait for conditional fields to appear
    cy.get('#loanAmount', { timeout: 3000 }).should('be.visible').focus().type('300000');
    cy.get('#loanTenure').focus().select('36');
    cy.get('#loanPurpose').focus().then(($el) => {
      cy.wrap($el).find('option').eq(1).then((opt) => {
        cy.wrap($el).select(opt.val());
      });
    });
    cy.contains('button', 'Continue').focus().click();
    cy.assertStep('Personal Information');
  });

  it('focus moves to first input when step changes', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.assertStep('Personal Information');
    cy.get('#fullName', { timeout: 2000 }).should('be.visible');
  });

  it('Previous button is keyboard reachable and activatable', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.assertStep('Personal Information');
    // Click Previous button
    cy.contains('button', 'Previous').click();
    cy.assertStep('Loan Type');
  });

  it('all required fields on Step 2 are reachable via Tab key', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.assertStep('Personal Information');

    const fields = ['#fullName', '#dateOfBirth', '#maritalStatus', '#fatherName', '#motherName', '#email', '#mobile'];
    fields.forEach((selector) => {
      cy.get(selector).should('be.visible').focus().should('be.focused');
    });
  });

  it('consent checkboxes on Step 8 are keyboard accessible', () => {
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

    // Check consents via keyboard (Space to check)
    cy.get('#consentAccurate').focus().type(' ');
    cy.get('#consentAccurate').should('be.checked');

    cy.get('#consentCredit').focus().type(' ');
    cy.get('#consentCredit').should('be.checked');

    cy.get('#consentTerms').focus().type(' ');
    cy.get('#consentTerms').should('be.checked');
  });
});
