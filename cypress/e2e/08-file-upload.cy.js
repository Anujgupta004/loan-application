// Test 10: File Upload & Compression (P0)
describe('File Upload', () => {
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

  it('fillStep7 injects all required docs and signature, then Continue works', () => {
    navigateToStep7();
    cy.fillStep7({ panVerified: true });
    // Verify documents uploaded counter updated
    cy.contains('completed').should('be.visible');
    cy.contains('button', 'Continue').click();
    cy.assertStep('Review');
  });

  it('oversize file shows rejection error message', () => {
    navigateToStep7();

    // Create a fake file > 5MB and try to drop on aadhaarFront dropzone
    cy.window().then((win) => {
      // Create a blob larger than 5MB
      const largeContent = new win.Array(6 * 1024 * 1024).fill('a').join('');
      const blob = new win.Blob([largeContent], { type: 'image/png' });
      const file = new win.File([blob], 'large.png', { type: 'image/png' });
      const dt = new win.DataTransfer();
      dt.items.add(file);

      cy.get('#aadhaarFront-input').then(($input) => {
        const nativeInput = $input[0];
        Object.defineProperty(nativeInput, 'files', { value: dt.files, writable: false });
        nativeInput.dispatchEvent(new win.Event('change', { bubbles: true }));
      });
    });

    cy.contains('exceeds').should('be.visible');
  });

  it('wrong file type shows rejection error', () => {
    navigateToStep7();

    cy.window().then((win) => {
      // bankStatement only accepts PDF — try uploading a PNG
      const blob = new win.Blob(['fake'], { type: 'image/png' });
      const file = new win.File([blob], 'test.png', { type: 'image/png' });
      const dt = new win.DataTransfer();
      dt.items.add(file);

      cy.get('#bankStatement-input').then(($input) => {
        const nativeInput = $input[0];
        Object.defineProperty(nativeInput, 'files', { value: dt.files, writable: false });
        nativeInput.dispatchEvent(new win.Event('change', { bubbles: true }));
      });
    });

    cy.contains('unsupported file type').should('be.visible');
  });

  it('Cannot proceed from Step 7 without documents', () => {
    navigateToStep7();
    // Click continue without uploading anything
    cy.contains('button', 'Continue').click();
    // Should show validation errors
    cy.contains('is required').should('be.visible');
    // Should still be on Documents step
    cy.assertStep('Documents');
  });
});
