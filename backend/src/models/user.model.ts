import { Schema, models, model, InferSchemaType, HydratedDocument } from 'mongoose';
import { isEmail } from 'validator';
import UserValidator from 'configs/validators/user.validator';

const userSchema = new Schema({
  firstName: {
    type: String,
    required: [
      true,
      UserValidator.firstName.requiredErrorMessage
    ],
    minLength: [
      UserValidator.firstName.minLength.value, 
      UserValidator.firstName.minLength.errorMessage
    ],
    maxLength: [
      UserValidator.firstName.maxLength.value, 
      UserValidator.firstName.maxLength.errorMessage
    ]
  },
  lastName: {
    type: String,
    required: [
      true,
      UserValidator.lastName.requiredErrorMessage
    ],
    minLength: [
      UserValidator.lastName.minLength.value, 
      UserValidator.lastName.minLength.errorMessage
    ],
    maxLength: [
      UserValidator.lastName.maxLength.value, 
      UserValidator.lastName.maxLength.errorMessage
    ]
  },
  fullName: String,
  email: {
    type: String,
    required: [true, UserValidator.email.requiredErrorMessage],
    lowercase: true,
    unique: true,
    validate: [
      isEmail,
      UserValidator.email.invalidEmailMesssage
    ]
  },
  password: {
    type: String,
    required: [true, UserValidator.password.requiredErrorMessage],
    select: false
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Role can only be "user" or "admin'
    },
    default: 'user'
  },
  profilePhotoUrl: String,
  // for cloudinary - to be able to use it for user deletions
  profilePhotoPublicId: {
    type: String,
    select: false
  },
  lastTimeSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export type UserSchemaType = HydratedDocument<InferSchemaType<typeof userSchema>>;

const User = models.User || model('User', userSchema);

export default User;