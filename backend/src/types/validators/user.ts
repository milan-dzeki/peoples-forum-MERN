export interface NameValidator {
  minLength: number;
  maxLength: number;
}

export type IsSingleString = (value: string) => boolean;