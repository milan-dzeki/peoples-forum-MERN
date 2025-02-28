import { isEmail } from 'validator';

interface UserInputs {
  firstName: string | undefined;
  lastName: string | undefined;
  email: string | undefined;
  password: string | undefined;
  passwordConfirm: string | undefined;
}

interface ValidationErrors {
  [name: string]: string | null;
}

interface Errors {
  [name: string]: string;
}

interface ReturnError {
  error: string | null;
}

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

  private static validateNames = (value: string | undefined, key: 'firstName' | 'lastName'): ReturnError => {
    const invalidName = this.doesExistAsString(value, this[key].requiredErrorMessage);
    if (invalidName) {
      return { error: invalidName };
    }
    
    // add exclamation marks for value because it will exist if first check (above) doesn't return error msg
    const multiWord = this.isSingleString(value!, this[key].mustBeOneWordErrorMessage);
    if (multiWord) {
      return { error: multiWord };
    }
    
    const smallerLengthThanRequired = this.isSmallerThanMinLength(
      value!, 
      this[key].minLength.value, 
      this[key].minLength.errorMessage
    );
    if (smallerLengthThanRequired) {
      return { error: smallerLengthThanRequired };
    }

    const higherLengthThanRequired = this.isHigherThanMaxLength(
      value!, 
      this[key].maxLength.value, 
      this[key].maxLength.errorMessage
    );
    if (higherLengthThanRequired) {
      return { error: higherLengthThanRequired };
    }

    return { error: null };
  }

  private static isValidEmail (value: string | undefined): ReturnError {
    return !value || !isEmail(value)
      ? { error: this.email.invalidEmailMesssage }
      : { error: null };
  }

  private static arePasswordsTheSame (password: string, passwordConfim: string | undefined): string | null {
    return !passwordConfim || password !== passwordConfim
      ? this.password.passwordsNotTheSameErrorMessage
      : null;
  }

  private static validatePassword (password: string | undefined, passwordConfim: string | undefined): ReturnError {
    const invalidPassword = this.doesExistAsString(password, this.password.requiredErrorMessage);
    if (invalidPassword) {
      return { error: invalidPassword };
    }

    const smallerLengthThanRequired = this.isSmallerThanMinLength(
      password!, 
      this.password.minLength.value, 
      this.password.minLength.errorMessage
    );
    if (smallerLengthThanRequired) {
      return { error: smallerLengthThanRequired };
    }

    const higherLengthThanRequired = this.isHigherThanMaxLength(
      password!, 
      this.password.maxLength.value, 
      this.password.maxLength.errorMessage
    );
    if (higherLengthThanRequired) {
      return { error: higherLengthThanRequired };
    }

    const notSame = this.arePasswordsTheSame(password!, passwordConfim);
    if (notSame) {
      return { error: notSame };
    }

    return { error: null };
  }

  static validateUserInputs (userInputs: UserInputs) {
    const {
      firstName,
      lastName,
      email,
      password,
      passwordConfirm
    } = userInputs;

    const errors: Errors = {};

    const validationErrors: ValidationErrors = {
      firstNameError: this.validateNames(firstName, 'firstName').error,
      lastNameError: this.validateNames(lastName, 'lastName').error,
      emailError: this.isValidEmail(email).error,
      passwordError: this.validatePassword(password, passwordConfirm).error
    };

    Object.keys(validationErrors).forEach((key) => {
      if (validationErrors[key]) {
        errors[key] = validationErrors[key];
      }
    });

    return Object.keys(errors).length
      ? { errors }
      : { errors: null };
  }
}

export default UserValidator;