import jwt from 'jsonwebtoken';
import cloudinary from 'configs/cloudinary';
import type { UserSchemaType } from 'models/user.model';
import type { ResponseAuthUserType } from 'types/controllers/auth';
import User from 'models/user.model';
import Profile from 'models/profile.model';
import Friends from 'models/friendsAndFollowers/friends.model';
import Followers from 'models/friendsAndFollowers/followers.model';
import BlockedUsersSettings from 'models/settings/blockedUsersSettings.model';
import ProfileSettings from 'models/settings/profileSettings.model';
import MessagingSettings from 'models/settings/messagingSettings.model';
import PostsSettings from 'models/settings/postsSettings.model';
import ReceivedNotificationSettings from 'models/settings/receivedNotificationSettings.model';

export const createTokenCookieAndResponseUser = (user: UserSchemaType): {
  user: ResponseAuthUserType;
  token: string;
} | null => {
  const userId = user._id.toString();

  const responseUser: ResponseAuthUserType = {
    _id: userId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePhotoUrl: user.profilePhotoUrl || null,
    createdAt: user.createdAt
  };

  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  if (!token) {
    return null;
  }

  return { user: responseUser, token };
};

export const deleteUserAndPhotoOnSignupFail = async (user: UserSchemaType): Promise<void> => {
  if (user.profilePhotoUrl && user.profilePhotoPublicId) {
    await cloudinary.uploader.destroy(user.profilePhotoPublicId);
  }
  await User.deleteOne({ _id: user._id });
};

export const createRequiredCollectionsAfterUserCreation = async (userId: string): Promise<{
  createModelsError: string | null;
}> => {
  try {
    await Profile.create({ user: userId });
    await Friends.create({
      user: userId,
      receivedPendingRequests: [],
      sentPendingRequests: [],
      friends: []
    });
    await Followers.create({
      user: userId,
      myFollowers: [],
      peopleIFollow: []
    });
    await BlockedUsersSettings.create({
      user: userId,
      blockedByMe: [],
      blockedMe: []
    });
    await ProfileSettings.create({ user: userId });
    await MessagingSettings.create({ user: userId });
    await PostsSettings.create({ user: userId });
    await ReceivedNotificationSettings.create({ user: userId });

    return {
      createModelsError: null
    };
  } catch {
    await Profile.deleteMany({ user: userId });
    await Friends.deleteMany({ user: userId });
    await Followers.deleteMany({ user: userId });
    await BlockedUsersSettings.deleteMany({ user: userId });
    await ProfileSettings.deleteMany({ user: userId });
    await MessagingSettings.deleteMany({ user: userId });
    await PostsSettings.deleteMany({ user: userId });
    await ReceivedNotificationSettings.deleteMany({ user: userId });

    return {
      createModelsError: 'Error while creating user. Maybe server is down. Refresh the page and try again'
    };
  }
};

