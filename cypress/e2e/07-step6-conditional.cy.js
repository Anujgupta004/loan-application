// Test 9: Step 6 Conditional Visibility (P1)
describe('Step 6 Conditional Visibility', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('Step 6 is SKIPPED for personal loan below ₹5L threshold', () => {
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

    // Should land on Documents (Step 7), NOT Co-Applicant (Step 6)
    cy.assertStep('Documents');
  });

  it('Step 6 appears for personal loan ABOVE ₹5L threshold', () => {
    cy.fillStep1({ loanType: 'personal', amount: '600000', tenure: '48' });
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();
    cy.fillStep4();
    cy.clickNext();
    cy.fillStep5Salaried();
    cy.clickNext();

    // Should land on Co-Applicant (Step 6)
    cy.assertStep('Co-Applicant');
  });

  it('Step 6 always appears for home loan', () => {
    cy.fillStep1({ loanType: 'home', amount: '3000000', tenure: '120' });
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();
    cy.fillStep4();
    cy.clickNext();
    cy.fillStep5Salaried();
    cy.clickNext();

    // Home loan always requires co-applicant
    cy.assertStep('Co-Applicant');
  });

  it('Exactly ₹5,00,000 personal loan does NOT trigger Step 6 (exceeds = 5L+1)', () => {
    cy.fillStep1({ loanType: 'personal', amount: '500000', tenure: '36' });
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();
    cy.fillStep4();
    cy.clickNext();
    cy.fillStep5Salaried();
    cy.clickNext();

    // Exactly 5L should NOT trigger Step 6 (rule says "exceeds", so > not >=)
    cy.assertStep('Documents');
  });
});
