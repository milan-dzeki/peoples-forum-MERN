import { Response, NextFunction } from 'express';
import { RequestWithBodyType } from 'types/lib';
import catchAsync from 'utils/catchAsync';
import cloudinary from 'configs/cloudinary';
import AppError from 'utils/appError';
import UserValidator from 'configs/validators/user.validator';
import User from 'models/user.model';

export const signup = catchAsync(async (
  req: RequestWithBodyType, 
  res: Response, 
  next: NextFunction
) => {
  if (!req.fields) {
    next(new AppError(500, 'Request fields are missing. try refreshing the page and try again'));
    return;
  }

  const {
    firstName,
    lastName,
    email,
    password,
    passwordConfirm
  } = req.fields as {
    [key: string]: string | undefined;
  };
  /*
    need to type cast req.fields because it is wrongly typed in d.ts file => it says that each property is string[] | undefined
    which is not true - it is string | undefined
  */

  // validate fields
  const errors: {[error: string]: string} = {};

  const firstNameError = UserValidator.validateNames(firstName, 'firstName');
  if (firstNameError) {
    errors.firstName = firstNameError;
  }

  const lastNameError = UserValidator.validateNames(lastName, 'lastName');
  if (lastNameError) {
    errors.lastName = lastNameError;
  }

  const emailError = UserValidator.isValidEmail(email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordsError = UserValidator.validatePassword(password, passwordConfirm);
  if (passwordsError) {
    errors.password = passwordsError;
  }

  if (Object.keys(errors).length > 0) {
    next(new AppError(422, 'Invalid inputs', errors));
    return;
  }

  return res.send('success');
});