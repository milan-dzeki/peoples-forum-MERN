import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { RequestWithBodyType } from 'types/lib';
import { PrepareUserForCreateType } from 'types/controllers/auth';
import catchAsync from 'utils/catchAsync';
import cloudinary from 'configs/cloudinary';
import AppError from 'utils/appError';
import UserValidator from 'configs/validators/auth/signupValidator';
import AuthService from 'services/authService';
import User from 'models/userModel';

export const signup = catchAsync (async (
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
    [key: string]: string | undefined
  };
  /*
    need to type cast req.fields because it is wrongly typed in d.ts file => it says that each property is string[] | undefined
    which is not true - it is string | undefined
  */

  const { errors } = await UserValidator.validateUserInputs({
    firstName,
    lastName,
    email,
    password,
    passwordConfirm
  });

  const userWithEmailExists = await User.find({ email });
  if (userWithEmailExists.length) {
    next(new AppError(400, 'Provided email is already taken'));
    return;
  }

  if (errors) {
    next(new AppError(422, 'Invalid inputs', errors));
    return;
  }

  const hashedPassword = await bcrypt.hash(password!, 12);

  if (!hashedPassword) {
    next(new AppError(500, 'Setting password failed. Server is possibly down. refresh and try again'));
    return;
  }

  const prepareUserForCreation: PrepareUserForCreateType = {
    firstName: firstName!,
    lastName: lastName!,
    fullname: `${firstName} ${lastName}`,
    email: email!,
    password: hashedPassword,
    lastTimeSeen: new Date()
  };

  if (req.files && req.files.profilePhoto) {
    const profilePhoto = req.files.profilePhoto as any;
    if (profilePhoto.path) {
      const uploadCustomError = new AppError(
        500, 
        'Unable to upload the photo. Maybe servers are down. Refresh the page and try again.'
      );
      
      const uploadedPhoto = await cloudinary.uploader.upload(profilePhoto.path, (error: any) => {
        if (error) {
          next(uploadCustomError);
          return;
        }
      });

      if (!uploadedPhoto.secure_url || !uploadedPhoto.public_id) {
        next(uploadCustomError);
        return;
      } 
      prepareUserForCreation.profilePhotoUrl = uploadedPhoto.secure_url;
      prepareUserForCreation.profilePhotoPublicId = uploadedPhoto.secure_url;
    }
  }

  const newUser = await User.create(prepareUserForCreation);
  
  const signedUser = AuthService.createTokenCookieAndResponseUser(newUser);

  if (!signedUser) {
    await AuthService.deleteUserAndPhotoOnSignupFail(newUser);
    next(new AppError(500, 'User creation failed. Maybe servers are down. Refresh the page and try again'));
    return;
  }

  const { user, token } = signedUser;

  const { createModelsError } = await AuthService.createRequiredCollectionsAfterUserCreation(user._id.toString());
  if (createModelsError) {
    await AuthService.deleteUserAndPhotoOnSignupFail(newUser);
    next(new AppError(500, createModelsError));
    return;
  }

  res.cookie('_pplFrmCKK', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict'
  });

  return res.status(201).json({
    status: 'success',
    message: 'You have successfully signed up to peoples forum',
    user
  });
});

export const login = catchAsync (async (
  req: RequestWithBodyType, 
  res: Response, 
  next: NextFunction
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new AppError(422, 'Email and password are required'));
    return;
  }

  const userDB = await User.findOne({ email }).select('+password');

  if (!userDB) {
    next(new AppError(400, 'Invalid email or password'));
    return;
  }

  const isPasswordValid = await bcrypt.compare(password as string, userDB.password);
  if (!isPasswordValid) {
    next(new AppError(400, 'Invalid email or password'));
    return;
  }

  const signedUser = AuthService.createTokenCookieAndResponseUser(userDB);
  if (!signedUser) {
    next(new AppError(500, 'User login. Maybe servers are down. Refresh the page and try again'));
    return;
  }

  const { user, token } = signedUser;

  res.cookie('_pplFrmCKK', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict'
  });

  return res.status(200).json({
    status: 'success',
    message: 'Login successfull',
    user
  });
});