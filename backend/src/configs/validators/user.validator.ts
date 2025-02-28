import { isEmail } from 'validator';

class UserValidator {
  static firstName = {
    requiredErrorMessage: 'First Name is required',
    mustBeOneWordErrorMessage: 'First Name must be one word',
    minLength: {
      value: 2,
      errorMessage: 'First Name must be at least 2 characters long'
    },
    maxLength: {
      value: 10,
      errorMessage: 'First Name must not exceed 10 characters'
    },
  };

  static lastName = {
    requiredErrorMessage: 'Last Name is required',
    minLength: {
      value: 2,
      errorMessage: 'Last Name must be at least 2 characters long'
    },
    maxLength: {
      value: 10,
      errorMessage: 'Last Name must not exceed 10 characters'
    },
    mustBeOneWordErrorMessage: 'Last Name must be one word',
  };

  static email = {
    requiredErrorMessage: 'Email is required',
    invalidEmailMesssage: 'Provided Email format is invalid'
  };

  static password = {
    requiredErrorMessage: 'Password is required',
    minLength: {
      value: 6,
      errorMessage: 'Password must be at least 6 characters long'
    },
    maxLength: {
      value: 20,
      errorMessage: 'Password must be under 20 characters'
    },
    passwordsNotTheSameErrorMessage: 'Passwords must be the same'
  };

  private static doesExistAsString (value: unknown, errorMessage: string): string | null {
    return !value || (value && typeof value === 'string' && value.trim().length === 0) || (value && typeof value !== 'string')
      ? errorMessage
      : null;
  }

  private static isSingleString (value: string, errorMessage: string): string | null {
    return value.split(' ').length > 1
      ? errorMessage
      : null
  }

  private static isSmallerThanMinLength (
    value: string, 
    minLength: number, 
    errorMessage: string
  ): string | null {
    return value.trim().length < minLength
      ? errorMessage
      : null;
  }

  private static isHigherThanMaxLength (
    value: string, 
    maxLength: number, 
    errorMessage: string
  ): string | null {
    return value.trim().length > maxLength
      ? errorMessage
      : null;
  }

  static validateNames = (value: string | undefined, key: 'firstName' | 'lastName'): string | null => {
    const invalidName = this.doesExistAsString(value, this[key].requiredErrorMessage);
    if (invalidName) {
      return invalidName;
    }
    
    // add exclamation marks for value because it will exist if first check (above) doesn't return error msg
    const multiWord = this.isSingleString(value!, this[key].mustBeOneWordErrorMessage);
    if (multiWord) {
      return multiWord;
    }
    
    const smallerLengthThanRequired = this.isSmallerThanMinLength(
      value!, 
      this[key].minLength.value, 
      this[key].minLength.errorMessage
    );
    if (smallerLengthThanRequired) {
      return smallerLengthThanRequired;
    }

    const higherLengthThanRequired = this.isHigherThanMaxLength(
      value!, 
      this[key].maxLength.value, 
      this[key].maxLength.errorMessage
    );
    if (higherLengthThanRequired) {
      return higherLengthThanRequired;
    }

    return null;
  }

  static isValidEmail (value: string | undefined): string | null {
    return !value || !isEmail(value)
      ? this.email.invalidEmailMesssage
      : null;
  }

  private static arePasswordsTheSame (password: string, passwordConfim: string | undefined): string | null {
    return !passwordConfim || password !== passwordConfim
      ? this.password.passwordsNotTheSameErrorMessage
      : null;
  }

  static validatePassword (password: string | undefined, passwordConfim: string | undefined): string | null {
    const invalidPassword = this.doesExistAsString(password, this.password.requiredErrorMessage);
    if (invalidPassword) {
      return invalidPassword;
    }

    const smallerLengthThanRequired = this.isSmallerThanMinLength(
      password!, 
      this.password.minLength.value, 
      this.password.minLength.errorMessage
    );
    if (smallerLengthThanRequired) {
      return smallerLengthThanRequired;
    }

    const higherLengthThanRequired = this.isHigherThanMaxLength(
      password!, 
      this.password.maxLength.value, 
      this.password.maxLength.errorMessage
    );
    if (higherLengthThanRequired) {
      return higherLengthThanRequired;
    }

    const notSame = this.arePasswordsTheSame(password!, passwordConfim);
    if (notSame) {
      return notSame;
    }

    return null;
  }
}

export default UserValidator;