// Test 8: Employment Type Switching (P0)
describe('Employment Type Switching', () => {
  function navigateToStep5() {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.fillStep1({ loanType: 'personal', amount: '300000', tenure: '36' });
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('Continue').click();
    cy.fillStep4();
    cy.clickNext();
    cy.assertStep('Employment');
  }

  it('shows salaried fields when Salaried is selected', () => {
    navigateToStep5();
    cy.get('input[name="employmentType"][value="salaried"]').check({ force: true });
    cy.get('#companyName').should('be.visible');
    cy.get('#designation').should('be.visible');
    cy.get('#monthlyNetSalary').should('be.visible');
    cy.get('#businessName').should('not.exist');
    cy.get('#gstNumber').should('not.exist');
  });

  it('shows self-employed fields when Self-Employed is selected', () => {
    navigateToStep5();
    cy.get('input[name="employmentType"][value="self_employed"]').check({ force: true });
    cy.get('#businessName').should('be.visible');
    cy.get('#annualTurnover').should('be.visible');
    cy.get('#monthlyIncome').should('be.visible');
    cy.get('#companyName').should('not.exist');
    cy.get('#gstNumber').should('not.exist'); // no GST for self-employed
  });

  it('shows GST field only for Business Owner', () => {
    navigateToStep5();
    cy.get('input[name="employmentType"][value="business_owner"]').check({ force: true });
    cy.get('#gstNumber').should('be.visible');
    cy.get('#businessName').should('be.visible');
  });

  it('clears salaried data when switching to self-employed', () => {
    navigateToStep5();
    cy.get('input[name="employmentType"][value="salaried"]').check({ force: true });
    cy.get('#companyName').type('Test Company');

    cy.get('input[name="employmentType"][value="self_employed"]').check({ force: true });
    cy.get('input[name="employmentType"][value="salaried"]').check({ force: true });
    cy.get('#companyName').should('have.value', ''); // cleared
  });

  it('Business loan disallows Salaried employment type', () => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.fillStep1({ loanType: 'business', amount: '2000000', tenure: '60' });
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('Continue').click();
    cy.fillStep4();
    cy.clickNext();

    cy.assertStep('Employment');
    // Salaried option should not be present for business loans
    cy.get('input[name="employmentType"][value="salaried"]').should('not.exist');
  });
});
