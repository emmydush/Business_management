import { useState, useCallback, useEffect } from 'react';
import { validateForm } from '../utils/validation';

/**
 * Custom hook for form validation
 * Prevents invalid submissions and guides users to correct input
 */
export const useFormValidation = (initialValues = {}, validationRules = {}, submitCallback) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [submitCount, setSubmitCount] = useState(0);

    // Validate form whenever values change
    useEffect(() => {
        const validation = validateForm(values, validationRules);
        setErrors(validation.errors);
        setIsValid(validation.isValid);
    }, [values, validationRules]);

    // Handle input change
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;

        setValues(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Mark field as touched
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
    }, []);

    // Handle input blur
    const handleBlur = useCallback((e) => {
        const { name } = e.target;

        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
    }, []);

    // Set value programmatically
    const setValue = useCallback((name, value) => {
        setValues(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    // Set multiple values
    const setMultipleValues = useCallback((newValues) => {
        setValues(prev => ({
            ...prev,
            ...newValues
        }));
    }, []);

    // Reset form
    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
        setSubmitCount(0);
    }, [initialValues]);

    // Handle form submission
    const handleSubmit = useCallback(async (e) => {
        if (e) {
            e.preventDefault();
        }

        // Mark all fields as touched
        const allTouched = Object.keys(validationRules).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
        setTouched(allTouched);

        // Increment submit count
        setSubmitCount(prev => prev + 1);

        // Validate
        const validation = validateForm(values, validationRules);

        if (!validation.isValid) {
            setErrors(validation.errors);

            // Focus first error field
            const firstErrorField = Object.keys(validation.errors)[0];
            const element = document.querySelector(`[name="${firstErrorField}"]`);
            if (element) {
                element.focus();
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            return false;
        }

        // Submit form
        setIsSubmitting(true);

        try {
            if (submitCallback) {
                await submitCallback(values);
            }
            return true;
        } catch (error) {
            console.error('Form submission error:', error);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [values, validationRules, submitCallback]);

    // Get field props (for easy spreading)
    const getFieldProps = useCallback((name) => ({
        name,
        value: values[name] || '',
        onChange: handleChange,
        onBlur: handleBlur,
        'aria-invalid': touched[name] && errors[name] ? 'true' : 'false',
        'aria-describedby': errors[name] ? `${name}-error` : undefined
    }), [values, errors, touched, handleChange, handleBlur]);

    // Get field error
    const getFieldError = useCallback((name) => {
        return touched[name] ? errors[name] : null;
    }, [errors, touched]);

    // Check if field has error
    const hasError = useCallback((name) => {
        return touched[name] && !!errors[name];
    }, [errors, touched]);

    // Check if form can be submitted
    const canSubmit = !isSubmitting && isValid;

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        canSubmit,
        submitCount,
        handleChange,
        handleBlur,
        handleSubmit,
        setValue,
        setMultipleValues,
        resetForm,
        getFieldProps,
        getFieldError,
        hasError
    };
};

/**
 * Hook for field-level validation (real-time)
 */
export const useFieldValidation = (value, rules) => {
    const [error, setError] = useState(null);
    const [isValid, setIsValid] = useState(true);

    useEffect(() => {
        if (!rules) {
            setIsValid(true);
            setError(null);
            return;
        }

        const validation = validateForm({ field: value }, { field: rules });
        setIsValid(validation.isValid);
        setError(validation.errors.field || null);
    }, [value, rules]);

    return { error, isValid };
};

/**
 * Hook for progressive form disclosure
 * Only shows next fields when previous are valid
 */
export const useProgressiveForm = (steps = []) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);

    const goToNextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep, steps.length]);

    const goToPreviousStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const goToStep = useCallback((stepIndex) => {
        if (stepIndex >= 0 && stepIndex < steps.length) {
            setCurrentStep(stepIndex);
        }
    }, [steps.length]);

    const isStepCompleted = useCallback((stepIndex) => {
        return completedSteps.includes(stepIndex);
    }, [completedSteps]);

    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;
    const progress = ((currentStep + 1) / steps.length) * 100;

    return {
        currentStep,
        currentStepData: steps[currentStep],
        isLastStep,
        isFirstStep,
        progress,
        goToNextStep,
        goToPreviousStep,
        goToStep,
        isStepCompleted
    };
};

export default useFormValidation;
