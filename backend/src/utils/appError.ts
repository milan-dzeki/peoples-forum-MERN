import { MultipleErrorsType } from 'types/errors';

class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  errors: MultipleErrorsType | null;

  constructor (
    statusCode: number,
    message: string,
    errors: MultipleErrorsType | null = null
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errors = errors;
    this.isOperational = true;
  }
}

export default AppError;