export type MultipleErrorsType = {
  [errorName: string]: string;
}[];

export interface ErrorResponseType {
  status: string;
  message?: string;
  errors?: MultipleErrorsType;
}