export interface PrepareUserForCreateType {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  password: string;
  profilePhotoUrl?: string;
  profilePhotoPublicId?: string;
  lastTimeSeen: Date;
}

export interface ResponseAuthUserType {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string | null | undefined;
  email: string;
  role: "user" | "admin";
  profilePhotoUrl: string | null;
  createdAt: NativeDate;
}