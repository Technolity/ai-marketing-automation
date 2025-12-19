/**
 * OSWizard - Modular Structure
 * 
 * This is the barrel export for the OSWizard component.
 * The component has been refactored into smaller, more manageable pieces:
 * 
 * Structure:
 * ├── index.js          - This file (barrel export)
 * ├── OSWizardMain.jsx  - Main component (to be created)
 * ├── hooks/
 * │   ├── useWizardState.js     - Core state management
 * │   └── useWizardSessions.js  - Session save/load/delete
 * ├── components/
 * │   ├── ProcessingAnimation.jsx  - Loading overlay
 * │   └── QuestionProgressBar.jsx  - Progress indicator
 * └── utils/
 *     ├── formatters.js   - Display formatting
 *     └── validators.js   - Input validation
 * 
 * The original OSWizard.jsx is kept as OSWizard.backup.jsx for reference.
 * 
 * TODO: Complete the refactoring by:
 * 1. Creating OSWizardMain.jsx that uses all the extracted hooks/components
 * 2. Updating intake_form/page.jsx to use the new modular structure
 * 3. Testing all functionality works as before
 */

// Export hooks
export { useWizardState, useWizardSessions } from './hooks';

// Export components
export { ProcessingAnimation, QuestionProgressBar } from './components';

// Export utils
export * from './utils';

// NOTE: The main component is still OSWizard.jsx in the parent directory
// This modular structure is ready to be integrated once all components are complete
