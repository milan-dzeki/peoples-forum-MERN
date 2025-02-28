import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { RequestWithBodyType } from 'types/lib';
import { PrepareUserForCreateType } from 'types/controllers/auth';
import catchAsync from 'utils/catchAsync';
import cloudinary from 'configs/cloudinary';
import AppError from 'utils/appError';
import UserValidator from 'configs/validators/user.validator';
import createTokenCookieAndResponseUser from 'services/auth/auth.service';
import User from 'models/user.model';
import Profile from 'models/profile.model';
import Friends from 'models/friendsAndFollowers/friends.model';
import Followers from 'models/friendsAndFollowers/followers.model';
import BlockedUsersSettings from 'models/settings/blockedUsersSettings.model';
import ProfileSettings from 'models/settings/profileSettings.model';
import MessagingSettings from 'models/settings/messagingSettings.model';
import PostsSettings from 'models/settings/postsSettings.model';
import ReceivedNotificationSettings from 'models/settings/receivedNotificationSettings.model';

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

  const userWithEmailExists = await User.find({ email });
  if (userWithEmailExists.length) {
    next(new AppError(400, 'Provided email is already taken'));
    return;
  }

  if (Object.keys(errors).length > 0) {
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
  
  const signedUser = createTokenCookieAndResponseUser(newUser);

  if (!signedUser) {
    if (newUser.profilePhotoPublicId) {
      await cloudinary.uploader.destroy(newUser.profilePhotoPublicId);
    }
    await User.deleteOne({ _id: newUser._id });
    next(new AppError(500, 'User creation failed. Maybe servers are down. Refresh the page and try again'));
    return;
  }

  const { user, token } = signedUser;

  await Profile.create({ user: user._id });
  await Friends.create({
    user: user._id,
    receivedPendingRequests: [],
    sentPendingRequests: [],
    friends: []
  });
  await Followers.create({
    user: user._id,
    myFollowers: [],
    peopleIFollow: []
  });
  await BlockedUsersSettings.create({
    user: user._id,
    blockedByMe: [],
    blockedMe: []
  });
  await ProfileSettings.create({ user: user._id });
  await MessagingSettings.create({ user: user._id });
  await PostsSettings.create({ user: user._id });
  await ReceivedNotificationSettings.create({ user: user._id });

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