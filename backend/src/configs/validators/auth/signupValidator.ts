import { isEmail } from 'validator';
import User from 'models/userModel';
import type { ValidationErrors, Errors } from 'types/validators';
import type { UserInputs } from 'types/validators/signupValidatorTypes';
import signupInputRules from './signupInputRules';
import ParentValidator from 'configs/validators/parentValidator';

class SignupValidator extends ParentValidator {
  private static validateNames = (value: string | undefined, key: 'firstName' | 'lastName'): string | null => {
    const invalidName = this.isValidNonEmptyString(value, signupInputRules[key].requiredErrorMessage);
    if (invalidName) {
      return invalidName;
    }
    
    // add exclamation marks for value because it will exist if first check (above) doesn't return error msg
    const multiWord = this.isSingleString(value!, signupInputRules[key].mustBeOneWordErrorMessage);
    if (multiWord) {
      return multiWord;
    }
    
    const smallerLengthThanRequired = this.isSmallerThanMinLength(
      value!, 
      signupInputRules[key].minLength.value, 
      signupInputRules[key].minLength.errorMessage
    );
    if (smallerLengthThanRequired) {
      return smallerLengthThanRequired;
    }

    const higherLengthThanRequired = this.isHigherThanMaxLength(
      value!, 
      signupInputRules[key].maxLength.value, 
      signupInputRules[key].maxLength.errorMessage
    );
    if (higherLengthThanRequired) {
      return higherLengthThanRequired;
    }

    return null;
  }

  private static isValidEmail (value: string | undefined): string | null {
    return !value || !isEmail(value)
      ? signupInputRules.email.invalidEmailMesssage
      : null;
  }

  private static async doesUserWithEmailAlreadyExist (email: string | undefined): Promise<string | null> {
    const emailInvalidError = this.isValidEmail(email);
    if (emailInvalidError) {
      return emailInvalidError;
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

  private static validatePassword (password: string | undefined, passwordConfim: string | undefined): string | null {
    const invalidPassword = this.isValidNonEmptyString(password, signupInputRules.password.requiredErrorMessage);
    if (invalidPassword) {
      return invalidPassword;
    }

    const smallerLengthThanRequired = this.isSmallerThanMinLength(
      password!, 
      signupInputRules.password.minLength.value, 
      signupInputRules.password.minLength.errorMessage
    );
    if (smallerLengthThanRequired) {
      return smallerLengthThanRequired;
    }

    const higherLengthThanRequired = this.isHigherThanMaxLength(
      password!, 
      signupInputRules.password.maxLength.value, 
      signupInputRules.password.maxLength.errorMessage
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

  static async validateUserInputs (userInputs: UserInputs): Promise<{ errors: Errors | null }> {
    const {
      firstName,
      lastName,
      email,
      password,
      passwordConfirm
    } = userInputs;

    const errors: Errors = {};

    const userWithEmailExistsError = await this.doesUserWithEmailAlreadyExist(email)

    const validationErrors: ValidationErrors = {
      firstNameError: this.validateNames(firstName, 'firstName'),
      lastNameError: this.validateNames(lastName, 'lastName'),
      emailError: userWithEmailExistsError,
      passwordError: this.validatePassword(password, passwordConfirm)
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

export default SignupValidator;