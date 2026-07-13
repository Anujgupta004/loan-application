// Test 11: E-Signature Capture (P1)
describe('E-Signature Capture', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  function navigateToStep7() {
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
  }

  it('shows signature validation error when no signature drawn', () => {
    navigateToStep7();
    // Inject docs but NO signature
    cy.window().then((win) => {
      cy.window().should('have.property', '__step7SetDocuments');
      cy.window().then((w) => {
        const requiredDocs = w.__step7RequiredDocs || [];
        const syntheticDocs = {};
        requiredDocs.forEach((doc) => {
          if (!doc.required) return;
          const fakeBlob = new w.Blob(['test'], { type: 'application/pdf' });
          const fakeFile = new w.File([fakeBlob], `${doc.key}-test.pdf`, { type: 'application/pdf' });
          syntheticDocs[doc.key] = [{ file: fakeFile, preview: null, name: fakeFile.name, type: fakeFile.type, size: fakeFile.size, info: null }];
        });
        w.__step7SetDocuments(syntheticDocs);
        // Do NOT set signature
      });
    });
    cy.wait(300);
    cy.contains('button', 'Continue').click();
    cy.contains('E-signature is required').should('be.visible');
  });

  it('draws signature and verifies it appears in review step', () => {
    navigateToStep7();
    cy.fillStep7({ panVerified: true });
    cy.contains('button', 'Continue').click();

    cy.assertStep('Review');
    // Signature image should be visible in review
    cy.get('img[alt*="signature"]').should('be.visible');
  });

  it('Clear button resets signature canvas', () => {
    navigateToStep7();
    // Draw a signature manually
    cy.drawSignature('canvas');
    cy.wait(300);
    // Canvas should not be empty now
    cy.contains('✓ Signature captured').should('be.visible');
    // Clear it
    cy.contains('button', 'Clear').click();
    cy.contains('Sign above using mouse or touch').should('be.visible');
  });
});
