// ============================================================
// Custom Cypress Commands for LendSwift Loan Application
// ============================================================

/**
 * Fill Step 1: Loan Type & Amount
 */
Cypress.Commands.add('fillStep1', ({ loanType = 'personal', amount = '300000', tenure = '36', purpose } = {}) => {
  // Select loan type
  cy.get(`input[name="loanType"][value="${loanType}"]`).check({ force: true });

  // Wait for amount field to appear
  cy.get('#loanAmount').should('be.visible').clear().type(amount);

  // Select tenure
  cy.get('#loanTenure').select(tenure, { force: true });

  // Select purpose (first option for that loan type if not specified)
  if (purpose) {
    cy.get('#loanPurpose').select(purpose, { force: true });
  } else {
    cy.get('#loanPurpose').find('option').eq(1).then((opt) => {
      cy.get('#loanPurpose').select(opt.val());
    });
  }
});

/**
 * Fill Step 2: Personal Information
 */
Cypress.Commands.add('fillStep2', ({
  fullName = 'Rahul Kumar Sharma',
  dob = '1990-05-15',
  gender = 'male',
  maritalStatus = 'single',
  fatherName = 'Suresh Kumar Sharma',
  motherName = 'Sunita Sharma',
  email = 'rahul.sharma@example.com',
  mobile = '9876543210',
} = {}) => {
  cy.get('#fullName').clear().type(fullName);
  cy.get('#dateOfBirth').type(dob);
  cy.get(`input[name="gender"][value="${gender}"]`).check({ force: true });
  cy.get('#maritalStatus').select(maritalStatus);
  cy.get('#fatherName').clear().type(fatherName);
  cy.get('#motherName').clear().type(motherName);
  cy.get('#email').clear().type(email);
  cy.get('#mobile').clear().type(mobile);
});

/**
 * Fill Step 3: KYC
 * Note: Uses valid PAN/Aadhaar that pass validation
 */
Cypress.Commands.add('fillStep3', ({
  pan = 'ABCPE1234F',
  aadhaar = '499118665246',
} = {}) => {
  cy.get('#panNumber').clear().type(pan).blur();
  // Wait for verification simulation
  cy.wait(2000);
  cy.get('#aadhaarNumber').clear().type(aadhaar).blur();
  cy.wait(2000);
  cy.get('#aadhaarConsent').check({ force: true });
});

/**
 * Fill Step 4: Address
 */
Cypress.Commands.add('fillStep4', ({
  line1 = 'Flat 301, Sunshine Apartments, MG Road',
  pinCode = '560001',
  residenceType = 'owned',
  years = '5',
} = {}) => {
  cy.get('#currentLine1').clear().type(line1);
  cy.get('#currentPinCode').clear().type(pinCode).blur();
  cy.wait(800); // PIN lookup delay
  cy.get('#residenceType').select(residenceType);
  cy.get('#yearsAtCurrentAddress').clear().type(years);
  // sameAsPermanent is checked by default
});

/**
 * Fill Step 5: Employment
 */
Cypress.Commands.add('fillStep5Salaried', ({
  company = 'ABC Technologies Pvt Ltd',
  designation = 'Software Engineer',
  salary = '75000',
  experience = '5',
} = {}) => {
  cy.get(`input[name="employmentType"][value="salaried"]`).check({ force: true });
  cy.get('#companyName').clear().type(company);
  cy.get('#designation').clear().type(designation);
  cy.get('#monthlyNetSalary').clear().type(salary);
  cy.get('#yearsOfExperience').clear().type(experience);
});

Cypress.Commands.add('fillStep5Business', ({
  name = 'Tech Solutions LLP',
  type = 'LLP',
  turnover = '2400000',
  income = '120000',
  years = '5',
  gst = '27ABCDE1234F1Z5',
  experience = '7',
} = {}) => {
  cy.get(`input[name="employmentType"][value="business_owner"]`).check({ force: true });
  cy.get('#businessName').clear().type(name);
  cy.get('#businessType').select(type);
  cy.get('#annualTurnover').clear().type(turnover);
  cy.get('#monthlyIncome').clear().type(income);
  cy.get('#yearsInBusiness').clear().type(years);
  cy.get('#gstNumber').clear().type(gst);
  cy.get('#yearsOfExperience').clear().type(experience);
  cy.get('#businessAddressLine1').clear().type('Shop 12, Commercial Complex, MG Road');
  cy.get('#businessCity').clear().type('Bengaluru');
  cy.get('#businessState').select('Karnataka');
});

/**
 * Click Next button
 */
Cypress.Commands.add('clickNext', () => {
  cy.contains('button', 'Continue').click();
});

/**
 * Click Previous button
 */
Cypress.Commands.add('clickPrev', () => {
  cy.contains('button', 'Previous').click();
});

/**
 * Assert current step by heading text
 */
Cypress.Commands.add('assertStep', (heading) => {
  cy.contains('h2', heading).should('be.visible');
});

/**
 * Draw a signature on the canvas
 */
Cypress.Commands.add('drawSignature', (canvasSelector = 'canvas') => {
  cy.get(canvasSelector).then(($canvas) => {
    const canvas = $canvas[0];
    const rect = canvas.getBoundingClientRect();
    const startX = rect.left + 50;
    const startY = rect.top + 80;

    cy.wrap(canvas)
      .trigger('mousedown', { clientX: startX, clientY: startY })
      .trigger('mousemove', { clientX: startX + 80, clientY: startY - 30 })
      .trigger('mousemove', { clientX: startX + 160, clientY: startY + 20 })
      .trigger('mouseup');
  });
});

/**
 * Fill Step 7: Documents & E-Signature
 * Uses window.__step7SetDocuments injected by Step7Documents component
 * when running under Cypress, to bypass real file upload UI.
 */
Cypress.Commands.add('fillStep7', ({
  panVerified = true,
} = {}) => {
  // Wait for Step7 to mount and expose its setters
  cy.window().should('have.property', '__step7SetDocuments');

  cy.window().then((win) => {
    const requiredDocs = win.__step7RequiredDocs || [];

    // Build synthetic documents state: each required doc gets a fake File entry
    const syntheticDocs = {};
    requiredDocs.forEach((doc) => {
      if (!doc.required) return;
      // Create a minimal fake file object that satisfies the component's shape
      const fakeBlob = new win.Blob(['test'], { type: doc.accept ? Object.keys(doc.accept)[0] : 'application/pdf' });
      const fakeFile = new win.File([fakeBlob], `${doc.key}-test.pdf`, {
        type: doc.accept ? Object.keys(doc.accept)[0] : 'application/pdf',
      });
      syntheticDocs[doc.key] = [{
        file: fakeFile,
        preview: null,
        name: fakeFile.name,
        type: fakeFile.type,
        size: fakeFile.size,
        info: null,
      }];
    });

    // Inject documents into React state
    win.__step7SetDocuments(syntheticDocs);

    // Set a synthetic signature (base64 1x1 transparent PNG)
    win.__step7SetSignature('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  });

  // Small wait for React to re-render
  cy.wait(400);
});
