/**
 * OSWizard Utility Functions - Validators
 * 
 * Contains validation logic for step inputs.
 * Extracted from OSWizard.jsx for maintainability.
 */

import { STEP_INPUTS } from '@/lib/os-wizard-data';

/**
 * Validate all inputs for a given step
 * @param {number} currentStep - The current step number
 * @param {object} currentInput - The current input values
 * @returns {object} { valid: boolean, emptyFields: string[], errors: object }
 */
export const validateStepInputs = (currentStep, currentInput) => {
    const stepInputs = STEP_INPUTS[currentStep];
    if (!stepInputs) return { valid: true, emptyFields: [], errors: {} };

    const emptyFields = [];
    const errors = {};

    stepInputs.forEach(input => {
        // Skip conditional inputs if their condition isn't met
        if (input.conditionalOn) {
            const parentValue = currentInput[input.conditionalOn] || [];
            if (!parentValue.includes(input.conditionalValue)) {
                return; // Skip validation for this field
            }
        }

        // Skip validation for optional fields
        if (input.optional) {
            return;
        }

        const value = currentInput[input.name];
        let isInvalid = false;

        // Handle arrays (multiselect)
        if (input.type === 'multiselect') {
            if (!value || (Array.isArray(value) && value.length === 0)) {
                isInvalid = true;
                errors[input.name] = 'Please select at least one option';
            }
        }
        // Handle select
        else if (input.type === 'select') {
            if (!value || !value.trim()) {
                isInvalid = true;
                errors[input.name] = 'Please select an option';
            }
        }
        // Handle text inputs
        else {
            const strValue = value || '';
            if (!strValue.trim()) {
                isInvalid = true;
                errors[input.name] = 'This field is required';
            } else if (strValue.trim().length < 3) {
                isInvalid = true;
                errors[input.name] = 'Please enter at least 3 characters';
            }
        }

        if (isInvalid) {
            emptyFields.push(input.label);
        }
    });

    return {
        valid: emptyFields.length === 0,
        emptyFields,
        errors
    };
};
