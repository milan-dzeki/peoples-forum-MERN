export interface MultipleErrorsType {
  [errorName: string]: string | object | any[];
};

export interface ErrorResponseType {
  status: string;
  message?: string;
  errors?: MultipleErrorsType;
}