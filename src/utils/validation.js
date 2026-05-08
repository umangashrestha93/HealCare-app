/**
 * Form Validation Utilities
 */

export const validation = {
  // Email validation
  email: (value) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return '';
  },

  // Password validation
  password: (value, minLength = 6) => {
    if (!value) return 'Password is required';
    if (value.length < minLength) return `Password must be at least ${minLength} characters`;
    return '';
  },

  // First name validation
  firstName: (value) => {
    if (!value) return 'First name is required';
    if (value.trim().length < 2) return 'First name must be at least 2 characters';
    if (value.trim().length > 50) return 'First name must be less than 50 characters';
    return '';
  },

  // Last name validation
  lastName: (value) => {
    if (!value) return 'Last name is required';
    if (value.trim().length < 2) return 'Last name must be at least 2 characters';
    if (value.trim().length > 50) return 'Last name must be less than 50 characters';
    return '';
  },

  // Phone validation
  phone: (value) => {
    if (!value) return '';
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
    return '';
  },

  // Location validation
  location: (value) => {
    if (!value) return 'Location is required';
    if (value.trim().length < 2) return 'Location must be at least 2 characters';
    return '';
  },

  // Discipline validation
  discipline: (value) => {
    if (!value) return 'Please select a discipline';
    return '';
  },

  // Years of experience validation
  yearsExp: (value) => {
    if (value === '' || value === undefined) return 'Years of experience is required';
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return 'Please enter a valid number';
    if (num > 70) return 'Years of experience cannot exceed 70';
    return '';
  },

  // ABN validation (Australian Business Number)
  abn: (value) => {
    if (!value) return '';
    if (!/^\d{11}$/.test(value.replace(/\s/g, ''))) {
      return 'ABN must be 11 digits';
    }
    return '';
  },

  // Bio validation
  bio: (value) => {
    if (value && value.length > 500) return 'Bio must be less than 500 characters';
    return '';
  },

  // Generic required field
  required: (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return '';
  },
};

/**
 * Validate entire form object
 */
export const validateForm = (data, schema) => {
  const errors = {};
  Object.keys(schema).forEach((field) => {
    const error = schema[field](data[field]);
    if (error) {
      errors[field] = error;
    }
  });
  return errors;
};

/**
 * Check if form has any errors
 */
export const hasErrors = (errors) => Object.values(errors).some((error) => error !== '');
