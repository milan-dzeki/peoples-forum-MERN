import jwt, { JwtPayload } from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { RequestWithUserIdType } from 'types/lib';
import AppError from 'utils/appError';
import User from 'models/userModel';

interface JWTCustom extends JwtPayload {
  userId?: string;
}

const notLoggedInError = new AppError(401, 'You are not logged in or your session has expired.');

const isAuth = async (
  req: RequestWithUserIdType, 
  _: Response, 
  next: NextFunction
) => {
  try {
    const cookies = req.cookies;
    if (!cookies) {
      next(notLoggedInError);
      return;
    }

    const token = cookies['_pplFrmCKK'];
    if (!token) {
      next(notLoggedInError);
      return;
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    if (!decodedToken || (decodedToken && !(decodedToken as JWTCustom).userId)) {
      next(notLoggedInError);
      return;
    }

    const user = await User.findById((decodedToken as JWTCustom).userId);
    if (!user) {
      next(notLoggedInError);
      return;
    }
    
    req.userId = user._id;
    next();
  } catch (error: unknown) {
    next(new AppError(500, 'Token expired'))
  }
};

export default isAuth;