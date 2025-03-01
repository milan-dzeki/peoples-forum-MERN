import { isEmail } from 'validator';
import User from 'models/userModel';
import signupInputRules from './signupInputsRules';

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

class SignupValidator {
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
    const invalidName = this.doesExistAsString(value, signupInputRules[key].requiredErrorMessage);
    if (invalidName) {
      return { error: invalidName };
    }
    
    // add exclamation marks for value because it will exist if first check (above) doesn't return error msg
    const multiWord = this.isSingleString(value!, signupInputRules[key].mustBeOneWordErrorMessage);
    if (multiWord) {
      return { error: multiWord };
    }
    
    const smallerLengthThanRequired = this.isSmallerThanMinLength(
      value!, 
      signupInputRules[key].minLength.value, 
      signupInputRules[key].minLength.errorMessage
    );
    if (smallerLengthThanRequired) {
      return { error: smallerLengthThanRequired };
    }

    const higherLengthThanRequired = this.isHigherThanMaxLength(
      value!, 
      signupInputRules[key].maxLength.value, 
      signupInputRules[key].maxLength.errorMessage
    );
    if (higherLengthThanRequired) {
      return { error: higherLengthThanRequired };
    }

    return { error: null };
  }

  private static isValidEmail (value: string | undefined): ReturnError {
    return !value || !isEmail(value)
      ? { error: signupInputRules.email.invalidEmailMesssage + 'validator' }
      : { error: null };
  }

  private static async doesUserWithEmailAlreadyExist (email: string | undefined): Promise<string | null> {
    const emailInvalidError = this.isValidEmail(email);
    if (emailInvalidError) {
      return emailInvalidError.error;
    }
    try {
      const userWithEmailExists = await User.find({ email });
      if (userWithEmailExists.length) {
        return signupInputRules.email.emailTakenErrorMessage
      }

      return null;
    } catch {
      return 'Checking email failed. Maybe servers are down. Refresh page and try again';
    }
  }

  private static arePasswordsTheSame (password: string, passwordConfim: string | undefined): string | null {
    return !passwordConfim || password !== passwordConfim
      ? signupInputRules.password.passwordsNotTheSameErrorMessage
      : null;
  }

  private static validatePassword (password: string | undefined, passwordConfim: string | undefined): ReturnError {
    const invalidPassword = this.doesExistAsString(password, signupInputRules.password.requiredErrorMessage);
    if (invalidPassword) {
      return { error: invalidPassword };
    }

    const smallerLengthThanRequired = this.isSmallerThanMinLength(
      password!, 
      signupInputRules.password.minLength.value, 
      signupInputRules.password.minLength.errorMessage
    );
    if (smallerLengthThanRequired) {
      return { error: smallerLengthThanRequired };
    }

    const higherLengthThanRequired = this.isHigherThanMaxLength(
      password!, 
      signupInputRules.password.maxLength.value, 
      signupInputRules.password.maxLength.errorMessage
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

  static async validateUserInputs (userInputs: UserInputs) {
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
      emailError: await this.doesUserWithEmailAlreadyExist(email),
      passwordError: this.validatePassword(password, passwordConfirm).error
    };

    Object.keys(validationErrors).forEach((key) => {
      if (validationErrors[key]) {
        errors[key] = validationErrors[key];
      }
    });
    console.log(errors);

    return Object.keys(errors).length
      ? { errors }
      : { errors: null };
  }
}

export default SignupValidator;