// Test 7: PIN Code Lookup (P0)
describe('PIN Code Lookup', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.fillStep1();
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('Continue').click();
    cy.assertStep('Address Information');
  });

  it('auto-fills city and state for a known PIN code', () => {
    cy.get('#currentLine1').type('Flat 12, Sunshine Apartments');
    cy.get('#currentPinCode').type('560001').blur();
    cy.wait(1000);
    cy.get('#currentCity').should('have.value', 'Bengaluru');
    cy.get('#currentState').should('have.value', 'Karnataka');
  });

  it('shows post office name on successful PIN lookup', () => {
    cy.get('#currentLine1').type('Test Address');
    cy.get('#currentPinCode').type('110001').blur();
    cy.wait(1000);
    cy.contains('Connaught Place').should('be.visible');
  });

  it('shows error for unknown PIN code', () => {
    cy.get('#currentLine1').type('Test Address');
    cy.get('#currentPinCode').type('999999').blur();
    cy.wait(1000);
    cy.contains('not found').should('be.visible');
  });

  it('shows validation error for non-6-digit PIN code', () => {
    cy.get('#currentLine1').type('Test Address');
    cy.get('#currentPinCode').type('1234').blur();
    cy.get('#yearsAtCurrentAddress').click(); // blur PIN
    cy.contains('exactly 6 digits').should('be.visible');
  });
});
