class ParentValidator {
  static isValidNonEmptyString (value: unknown, errorMessage: string): string | null {
    return !value || (value && typeof value === 'string' && value.trim().length === 0) || (value && typeof value !== 'string')
      ? errorMessage
      : null;
  }

  static isSingleString (value: string, errorMessage: string): string | null {
    return value.split(' ').length > 1
      ? errorMessage
      : null
  }

  static isSmallerThanMinLength (
    value: string, 
    minLength: number, 
    errorMessage: string
  ): string | null {
    return value.trim().length < minLength
      ? errorMessage
      : null;
  }

  static isHigherThanMaxLength (
    value: string, 
    maxLength: number, 
    errorMessage: string
  ): string | null {
    return value.trim().length > maxLength
      ? errorMessage
      : null;
  }
}

export default ParentValidator;