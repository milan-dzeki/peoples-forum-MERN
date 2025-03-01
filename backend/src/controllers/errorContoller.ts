import type { NextFunction, Response, ErrorRequestHandler } from 'express';
import { ErrorResponseType } from 'types/errors';
import { RequestWithBodyType } from 'types/lib';
import AppError from 'utils/appError';

export type ErrorHandlingMiddleware = (
  error: unknown,
  req: RequestWithBodyType,
  res: Response,
  next: NextFunction
) => Response<any, Record<string, any>>;

const globalErrorHandler: ErrorRequestHandler = (
  error,
  _,
  res,
  _1
) => {
  if (error instanceof AppError) {
    const {
      status,
      statusCode,
      message,
      errors
    } = error;
    
    const responseData: ErrorResponseType = { status };

    if (message.trim().length > 1) {
      responseData.message = message;
    }

    if (errors && Object.keys(errors).length > 0) {
      responseData.errors = errors;
    }

    res.status(statusCode).json(responseData);
    return;
  }
  console.log(error);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong'
  });
};

export default globalErrorHandler;