/**
 * Validation decorator - validates function arguments before execution.
 * Throws ValidationError if validation fails.
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export type ValidationRule = (value: unknown) => { valid: boolean; message: string };

export function Validate(...rules: ValidationRule[]) {
  return function <T extends (...args: unknown[]) => unknown>(
    _target: unknown,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> | void {
    const originalMethod = descriptor.value;
    if (originalMethod === undefined) return;

    descriptor.value = function (this: unknown, ...args: Parameters<T>) {
      for (const rule of rules) {
        const result = rule(args[0]);
        if (!result.valid) {
          throw new ValidationError(result.message);
        }
      }

      return originalMethod.apply(this, args);
    } as T;

    return descriptor;
  };
}

// Common validation rules for fuzzy matching
export const validationRules = {
  nonEmptyString: (value: unknown): { valid: boolean; message: string } => {
    if (typeof value !== 'string') {
      return { valid: false, message: 'Expected string' };
    }
    if (value.length === 0) {
      return { valid: false, message: 'String cannot be empty' };
    }
    return { valid: true, message: '' };
  },

  maxLength:
    (maxLen: number) =>
    (value: unknown): { valid: boolean; message: string } => {
      if (typeof value !== 'string') {
        return { valid: false, message: 'Expected string' };
      }
      if (value.length > maxLen) {
        return { valid: false, message: `String length exceeds maximum of ${maxLen}` };
      }
      return { valid: true, message: '' };
    },
};
