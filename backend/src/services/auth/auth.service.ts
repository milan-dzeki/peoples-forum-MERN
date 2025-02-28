import jwt from 'jsonwebtoken';
import type { UserSchemaType } from 'models/user.model';
import type { ResponseAuthUserType } from 'types/controllers/auth';

const createTokenCookieAndResponseUser = (user: UserSchemaType): {
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

export default createTokenCookieAndResponseUser;