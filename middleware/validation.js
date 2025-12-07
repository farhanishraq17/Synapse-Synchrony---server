import { validationResult } from 'express-validator';

/**
 * Validation Middleware
 * Checks for validation errors from express-validator
 * Returns 400 with error details if validation fails
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};
