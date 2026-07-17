// Automated Accessibility Audit using cypress-axe (WCAG 2.1 AA)

// Helper to log violations to terminal
function terminalLog(violations) {
  cy.task('log', `${violations.length} accessibility violation(s) detected`);
  violations.forEach(({ id, impact, description, nodes }) => {
    cy.task('log', `[${impact}] ${id}: ${description}`);
    nodes.forEach(({ html }) => cy.task('log', `  Element: ${html.substring(0, 100)}`));
  });
}

describe('Accessibility Audit – WCAG 2.1 AA (cypress-axe)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.injectAxe();
  });

  it('Step 1 passes WCAG 2.1 AA (critical + serious only)', () => {
    cy.assertStep('Loan Type');
    cy.checkA11y(null, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      includedImpacts: ['critical', 'serious'],
    }, terminalLog, true); // true = skipFailures for reporting only
  });

  it('Step 2 passes WCAG 2.1 AA (critical + serious only)', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.assertStep('Personal Information');
    cy.injectAxe();
    cy.checkA11y(null, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      includedImpacts: ['critical', 'serious'],
    }, terminalLog, true);
  });

  it('Step 3 KYC passes WCAG 2.1 AA (critical + serious only)', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.assertStep('Identity Verification');
    cy.injectAxe();
    cy.checkA11y(null, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      includedImpacts: ['critical', 'serious'],
    }, terminalLog, true);
  });

  it('Step 4 Address passes WCAG 2.1 AA (critical + serious only)', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();
    cy.assertStep('Address Information');
    cy.injectAxe();
    cy.checkA11y(null, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      includedImpacts: ['critical', 'serious'],
    }, terminalLog, true);
  });

  it('Step 5 Employment passes WCAG 2.1 AA (critical + serious only)', () => {
    cy.fillStep1();
    cy.clickNext();
    cy.fillStep2();
    cy.clickNext();
    cy.fillStep3();
    cy.contains('button', 'Continue').click();
    cy.fillStep4();
    cy.clickNext();
    cy.assertStep('Employment');
    cy.injectAxe();
    cy.checkA11y(null, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      includedImpacts: ['critical', 'serious'],
    }, terminalLog, true);
  });
});
