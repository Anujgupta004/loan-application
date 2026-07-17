// Global Cypress support file
// Import custom commands
import './commands';

// cypress-axe for automated accessibility testing
import 'cypress-axe';

// Ignore uncaught exceptions from crypto API in test env
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('crypto') || err.message.includes('Cannot read properties of null')) {
    return false;
  }
});
